import type { FastifyInstance } from 'fastify';

/** Placeholder — replaced with the full Compliance Agent in milestone M5. */
export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.get('/api/clients/:id/agent/runs', async () => []);
}
