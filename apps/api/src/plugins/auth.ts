import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { can, type Capability, type MemberRole, type TypedSupabaseClient } from '@obliq/shared';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  fullName: string;
  firmId: string;
  firmName: string;
  role: MemberRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
    /** Supabase client scoped to this user's JWT (RLS enforced). */
    db: TypedSupabaseClient;
  }
}

/**
 * Authentication: verify the Supabase access token.
 * Authorization context: load the caller's firm and role FROM THE DATABASE.
 * Nothing in the request body, query string or headers can choose the firm.
 */
export default fp(async (fastify: FastifyInstance) => {
  fastify.decorateRequest('user', null as unknown as AuthenticatedUser);
  fastify.decorateRequest('db', null as unknown as TypedSupabaseClient);

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.url.startsWith('/api/')) return;

    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Missing bearer token', statusCode: 401 });
    }

    const { data, error } = await fastify.supabaseAnon.auth.getUser(token);
    if (error || !data.user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token', statusCode: 401 });
    }

    const db = fastify.supabaseForUser(token);
    const lookupMembership = () =>
      db
        .from('firm_memberships')
        .select('role, firm:firms(id, name), profile:profiles(full_name)')
        .eq('user_id', data.user.id)
        .maybeSingle();

    let { data: membership, error: membershipError } = await lookupMembership();
    // A token minted milliseconds ago can be rejected as "issued at future" when
    // the auth server's clock is slightly ahead of the database's. Wait out the skew.
    for (let attempt = 0; membershipError?.code === 'PGRST303' && attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 750));
      ({ data: membership, error: membershipError } = await lookupMembership());
    }

    if (membershipError) {
      // Never report a database/JWT failure as "no firm": that hides the real cause.
      request.log.warn({ err: membershipError }, 'membership lookup failed');
      const jwtProblem = membershipError.code?.startsWith('PGRST3');
      return reply.code(jwtProblem ? 401 : 503).send({
        error: jwtProblem ? 'Unauthorized' : 'ServiceUnavailable',
        message: jwtProblem ? 'Session could not be verified, please retry' : 'Could not load your firm membership',
        statusCode: jwtProblem ? 401 : 503,
      });
    }

    if (!membership?.firm) {
      return reply
        .code(403)
        .send({ error: 'Forbidden', message: 'Your account is not a member of any firm', statusCode: 403 });
    }

    request.db = db;
    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      fullName: membership.profile?.full_name ?? data.user.email ?? 'Unknown user',
      firmId: membership.firm.id,
      firmName: membership.firm.name,
      role: membership.role,
    };
  });
});

/** Route-level guard for a clear 403. The database independently re-checks every write. */
export function requireCapability(capability: Capability) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!can(request.user.role, capability)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Your role (${request.user.role}) is not allowed to do this`,
        statusCode: 403,
      });
    }
  };
}
