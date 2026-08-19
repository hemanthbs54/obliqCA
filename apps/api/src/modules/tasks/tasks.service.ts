import type { Task, ChecklistItem, TaskStatus, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';
import { generateTaskForClientFiling, type ClientFilingWithType } from '../filings/filings.service.js';

export async function listTasksForClient(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  status?: TaskStatus,
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('client_id', clientId)
    .order('due_date');
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new ApiError(500, error.message);
  return data ?? [];
}

export async function getTask(supabase: TypedSupabaseClient, ownerId: string, taskId: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('id', taskId)
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Task not found');
  return data;
}

export async function updateTask(
  supabase: TypedSupabaseClient,
  ownerId: string,
  taskId: string,
  input: { status?: TaskStatus; checklist?: ChecklistItem[]; notes?: string },
): Promise<Task> {
  const patch: Record<string, unknown> = {};
  if (input.status !== undefined) {
    patch.status = input.status;
    patch.completed_at = input.status === 'completed' ? new Date().toISOString() : null;
  }
  if (input.checklist !== undefined) patch.checklist = input.checklist;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('owner_id', ownerId)
    .eq('id', taskId)
    .select('*')
    .single();
  if (error) throw new ApiError(500, error.message);
  return data;
}

/** Generates the next-period task for every active filing attached to a client. */
export async function generateTasksForClient(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<Task[]> {
  const { data: filings, error } = await supabase
    .from('client_filings')
    .select('*, filing_type:filing_types(*)')
    .eq('owner_id', ownerId)
    .eq('client_id', clientId)
    .eq('is_active', true);
  if (error) throw new ApiError(500, error.message);

  const tasks: Task[] = [];
  for (const filing of (filings ?? []) as unknown as ClientFilingWithType[]) {
    const task = await generateTaskForClientFiling(supabase, ownerId, clientId, filing, filing.filing_type);
    tasks.push(task);
  }
  return tasks;
}
