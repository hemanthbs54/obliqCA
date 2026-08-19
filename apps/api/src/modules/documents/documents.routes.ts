import type { FastifyInstance } from 'fastify';

/** Placeholder — replaced with the full upload/processing pipeline in milestone M4. */
export default async function documentsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/clients/:id/documents', async () => []);
}
