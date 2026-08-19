import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as filingsService from './filings.service.js';
import { attachFilingSchema } from './filings.schema.js';

const clientIdParams = z.object({ id: z.string().uuid() });
const filingIdParams = z.object({ id: z.string().uuid(), filingId: z.string().uuid() });

export default async function filingsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/filing-types', async () => {
    return filingsService.listFilingTypes(fastify.supabaseAdmin);
  });

  fastify.get('/api/clients/:id/filings', async (request) => {
    const { id } = clientIdParams.parse(request.params);
    return filingsService.listClientFilings(fastify.supabaseAdmin, request.user.id, id);
  });

  fastify.post('/api/clients/:id/filings', async (request, reply) => {
    const { id } = clientIdParams.parse(request.params);
    const body = attachFilingSchema.parse(request.body);
    const result = await filingsService.attachFiling(
      fastify.supabaseAdmin,
      request.user.id,
      id,
      body.filingTypeId,
      body.frequencyOverride,
    );
    return reply.code(201).send(result);
  });

  fastify.delete('/api/clients/:id/filings/:filingId', async (request, reply) => {
    const { id, filingId } = filingIdParams.parse(request.params);
    await filingsService.deactivateFiling(fastify.supabaseAdmin, request.user.id, id, filingId);
    return reply.code(204).send();
  });
}
