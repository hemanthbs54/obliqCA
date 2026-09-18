import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import {
  createSupabaseAdminClient,
  createSupabaseClient,
  type Database,
  type TypedSupabaseClient,
} from '@obliq/shared';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    /** Service role (bypasses RLS). Used ONLY for Storage object I/O, after the user's access was checked through RLS. */
    supabaseAdmin: TypedSupabaseClient;
    /** Anon key. Used only to validate access tokens. */
    supabaseAnon: TypedSupabaseClient;
    /** Acts as the signed-in user, so Postgres RLS applies to every query. */
    supabaseForUser: (accessToken: string) => TypedSupabaseClient;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('supabaseAdmin', createSupabaseAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY));
  fastify.decorate('supabaseAnon', createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY));
  fastify.decorate('supabaseForUser', (accessToken: string) =>
    createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }),
  );
});
