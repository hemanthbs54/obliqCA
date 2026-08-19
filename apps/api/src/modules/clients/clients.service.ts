import type { Client, ClientWithStatus, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';
import type { CreateClientInput, UpdateClientInput } from './clients.schema.js';

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

  const { data: statuses, error: statusError } = await supabase
    .from('compliance_status')
    .select('*')
    .eq('owner_id', ownerId);
  if (statusError) throw new ApiError(500, statusError.message);

  const statusByClient = new Map(statuses?.map((s) => [s.client_id, s]) ?? []);

  const merged: ClientWithStatus[] = (clients ?? []).map((client) => {
    const status = statusByClient.get(client.id);
    return {
      ...client,
      compliance_status: status?.status ?? 'on_track',
      next_due_date: status?.next_due_date ?? null,
      next_due_filing_type: status?.next_due_filing_type ?? null,
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
