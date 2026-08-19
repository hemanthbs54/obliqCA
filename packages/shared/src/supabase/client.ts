import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Framework-agnostic Supabase client factories. Next.js-specific
 * cookie-aware browser/server clients live in apps/web/src/lib/supabase
 * (via @supabase/ssr) so this package stays free of a Next.js dependency.
 */

/** Anon-key client — respects RLS. Safe to use from any Node context. */
export function createSupabaseClient(url: string, anonKey: string): TypedSupabaseClient {
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Service-role client — bypasses RLS. Backend-only (apps/api); never ship
 * the service role key to the browser.
 */
export function createSupabaseAdminClient(url: string, serviceRoleKey: string): TypedSupabaseClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
