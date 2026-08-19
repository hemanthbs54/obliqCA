import type { FastifyInstance } from 'fastify';

/** Placeholder — replaced with the full RAG query pipeline in milestone M4. */
export default async function ragRoutes(fastify: FastifyInstance) {
  fastify.get('/api/clients/:id/rag/history', async () => []);
}
