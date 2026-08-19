import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as ragService from './rag.service.js';

const queryBody = z.object({
  clientId: z.string().uuid(),
  question: z.string().min(1),
  documentId: z.string().uuid().optional(),
});
const clientIdParams = z.object({ id: z.string().uuid() });

export default async function ragRoutes(fastify: FastifyInstance) {
  fastify.post('/api/rag/query', async (request) => {
    const body = queryBody.parse(request.body);
    return ragService.queryRag(fastify.supabaseAdmin, request.user.id, body.clientId, body.question, body.documentId);
  });

  fastify.get('/api/clients/:id/rag/history', async (request) => {
    const { id } = clientIdParams.parse(request.params);
    return ragService.listRagHistory(fastify.supabaseAdmin, request.user.id, id);
  });
}
