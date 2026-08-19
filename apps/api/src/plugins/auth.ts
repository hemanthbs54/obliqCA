import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}

/**
 * Verifies the `Authorization: Bearer <supabase_access_token>` header on
 * every /api/* request via Supabase's own token introspection (one extra
 * network hop vs. verifying the JWT locally, acceptable at demo scale).
 * /health and the Swagger docs stay public.
 */
export default fp(async (fastify: FastifyInstance) => {
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

    request.user = { id: data.user.id, email: data.user.email ?? null };
  });
});
