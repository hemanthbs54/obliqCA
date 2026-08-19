import type { Client, ClientWithStatus, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';
import type { CreateClientInput, UpdateClientInput } from './clients.schema.js';
import { evaluateAllClientsCompliance, evaluateClientCompliance } from '../agent/agent.service.js';

export async function listClients(
  supabase: TypedSupabaseClient,
  ownerId: string,
  filters: { search?: string; status?: string } = {},
): Promise<ClientWithStatus[]> {
  let query = supabase.from('clients').select('*').eq('owner_id', ownerId).order('name');
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  const { data: clients, error } = await query;
  if (error) throw new ApiError(500, error.message);

  // Live-computed via the pure rule engine (cheap, no AI call) so due_soon/
  // overdue never goes stale just from time passing — see agent.rules.ts.
  const evaluations = await evaluateAllClientsCompliance(supabase, ownerId);

  const merged: ClientWithStatus[] = (clients ?? []).map((client) => {
    const evaluation = evaluations.get(client.id);
    return {
      ...client,
      compliance_status: evaluation?.status ?? 'on_track',
      next_due_date: evaluation?.nextDueDate ?? null,
      next_due_filing_type: evaluation?.nextDueFilingType ?? null,
    };
  });

  if (filters.status) {
    return merged.filter((c) => c.compliance_status === filters.status);
  }
  return merged;
}

export async function getClient(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('id', clientId)
    .maybeSingle();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Client not found');
  return data;
}

export async function getClientWithStatus(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
): Promise<ClientWithStatus> {
  const client = await getClient(supabase, ownerId, clientId);
  const evaluation = await evaluateClientCompliance(supabase, ownerId, clientId);
  return {
    ...client,
    compliance_status: evaluation.status,
    next_due_date: evaluation.nextDueDate,
    next_due_filing_type: evaluation.nextDueFilingType,
  };
}

export async function createClient(
  supabase: TypedSupabaseClient,
  ownerId: string,
  input: CreateClientInput,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      owner_id: ownerId,
      name: input.name,
      client_type: input.clientType,
      pan: input.pan || null,
      gstin: input.gstin || null,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      notes: input.notes || null,
    })
    .select('*')
    .single();
  if (error) throw new ApiError(500, error.message);
  return data;
}

export async function updateClient(
  supabase: TypedSupabaseClient,
  ownerId: string,
  clientId: string,
  input: UpdateClientInput,
): Promise<Client> {
  await getClient(supabase, ownerId, clientId);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.clientType !== undefined) patch.client_type = input.clientType;
  if (input.pan !== undefined) patch.pan = input.pan || null;
  if (input.gstin !== undefined) patch.gstin = input.gstin || null;
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.address !== undefined) patch.address = input.address || null;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  const { data, error } = await supabase
    .from('clients')
    .update(patch)
    .eq('owner_id', ownerId)
    .eq('id', clientId)
    .select('*')
    .single();
  if (error) throw new ApiError(500, error.message);
  return data;
}

export async function deleteClient(supabase: TypedSupabaseClient, ownerId: string, clientId: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('owner_id', ownerId).eq('id', clientId);
  if (error) throw new ApiError(500, error.message);
}
