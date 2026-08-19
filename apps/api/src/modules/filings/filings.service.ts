import type { FilingType, ClientFiling, Task, TypedSupabaseClient } from '@obliq/shared';
import { TASK_CHECKLIST_TEMPLATES } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';
import { computeNextPeriod } from './period.js';

export interface ClientFilingWithType extends ClientFiling {
  filing_type: FilingType;
}

export async function listFilingTypes(supabase: TypedSupabaseClient): Promise<FilingType[]> {
  const { data, error } = await supabase.from('filing_types').select('*').order('category').order('name');
  if (error) throw new ApiError(500, error.message);
  return data ?? [];
}

export async function listClientFilings(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<ClientFilingWithType[]> {
  const { data, error } = await supabase
    .from('client_filings')
    .select('*, filing_type:filing_types(*)')
    .eq('owner_id', ownerId)
    .eq('client_id', clientId)
    .order('created_at');
  if (error) throw new ApiError(500, error.message);
  return (data ?? []) as unknown as ClientFilingWithType[];
}

/** Creates (or reactivates) a client_filing and generates its first task. */
export async function attachFiling(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  filingTypeId: string,
  frequencyOverride?: 'monthly' | 'quarterly' | 'annually',
): Promise<{ clientFiling: ClientFiling; task: Task }> {
  const { data: filingType, error: filingTypeError } = await supabase
    .from('filing_types')
    .select('*')
    .eq('id', filingTypeId)
    .maybeSingle();
  if (filingTypeError) throw new ApiError(500, filingTypeError.message);
  if (!filingType) throw new ApiError(404, 'Filing type not found');

  const { data: clientFiling, error } = await supabase
    .from('client_filings')
    .upsert(
      {
        owner_id: ownerId,
        client_id: clientId,
        filing_type_id: filingTypeId,
        frequency_override: frequencyOverride ?? null,
        is_active: true,
      },
      { onConflict: 'client_id,filing_type_id' },
    )
    .select('*')
    .single();
  if (error) throw new ApiError(500, error.message);

  const task = await generateTaskForClientFiling(supabase, ownerId, clientId, clientFiling, filingType);
  return { clientFiling, task };
}

export async function generateTaskForClientFiling(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  clientFiling: ClientFiling,
  filingType: FilingType,
): Promise<Task> {
  const frequency = clientFiling.frequency_override ?? filingType.frequency;
  const { periodLabel, dueDate } = computeNextPeriod(frequency, new Date());
  const checklist = TASK_CHECKLIST_TEMPLATES[filingType.category].map((label) => ({ label, done: false }));

  const { data: existing } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_filing_id', clientFiling.id)
    .eq('period_label', periodLabel)
    .maybeSingle();
  if (existing) return existing;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      owner_id: ownerId,
      client_id: clientId,
      client_filing_id: clientFiling.id,
      period_label: periodLabel,
      due_date: dueDate,
      status: 'pending',
      checklist,
    })
    .select('*')
    .single();
  if (error) throw new ApiError(500, error.message);
  return task;
}

export async function deactivateFiling(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  clientFilingId: string,
): Promise<void> {
  const { error } = await supabase
    .from('client_filings')
    .update({ is_active: false })
    .eq('owner_id', ownerId)
    .eq('client_id', clientId)
    .eq('id', clientFilingId);
  if (error) throw new ApiError(500, error.message);
}
