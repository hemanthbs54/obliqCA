import type { Profile, TypedSupabaseClient } from '@obliq/shared';
import { ApiError } from '../../plugins/error-handler.js';

export async function getProfile(supabase: TypedSupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new ApiError(500, error.message);
  return data;
}

export async function upsertProfile(
  supabase: TypedSupabaseClient,
  userId: string,
  input: { firmName?: string; fullName?: string; phone?: string },
): Promise<Profile> {
  const patch: Record<string, unknown> = { id: userId };
  if (input.firmName !== undefined) patch.firm_name = input.firmName;
  if (input.fullName !== undefined) patch.full_name = input.fullName;
  if (input.phone !== undefined) patch.phone = input.phone;

  const { data, error } = await supabase
    .from('profiles')
    .upsert(patch as never, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw new ApiError(500, error.message);
  return data;
}
