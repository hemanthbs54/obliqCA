import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createSupabaseAdminClient, createSupabaseClient, type TypedSupabaseClient } from '@obliq/shared';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    supabaseAdmin: TypedSupabaseClient;
    supabaseAnon: TypedSupabaseClient;
  }
}

/**
 * Decorates the Fastify instance with two Supabase clients:
 * - supabaseAdmin: service-role, bypasses RLS — used for all data access
 *   (the API enforces owner_id scoping itself, mirroring the RLS policies).
 * - supabaseAnon: anon-key, used only to verify user access tokens.
 */
export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('supabaseAdmin', createSupabaseAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY));
  fastify.decorate('supabaseAnon', createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY));
});
