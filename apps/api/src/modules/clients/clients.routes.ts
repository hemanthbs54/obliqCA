import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as clientsService from './clients.service.js';
import { createClientSchema, updateClientSchema } from './clients.schema.js';

const listQuery = z.object({ search: z.string().optional(), status: z.string().optional() });
const idParams = z.object({ id: z.string().uuid() });

export default async function clientsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/clients', async (request) => {
    const query = listQuery.parse(request.query);
    return clientsService.listClients(fastify.supabaseAdmin, request.user.id, query);
  });

  fastify.post('/api/clients', async (request, reply) => {
    const body = createClientSchema.parse(request.body);
    const client = await clientsService.createClient(fastify.supabaseAdmin, request.user.id, body);
    return reply.code(201).send(client);
  });

  fastify.get('/api/clients/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    return clientsService.getClient(fastify.supabaseAdmin, request.user.id, id);
  });

  fastify.patch('/api/clients/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    const body = updateClientSchema.parse(request.body);
    return clientsService.updateClient(fastify.supabaseAdmin, request.user.id, id, body);
  });

  fastify.delete('/api/clients/:id', async (request, reply) => {
    const { id } = idParams.parse(request.params);
    await clientsService.deleteClient(fastify.supabaseAdmin, request.user.id, id);
    return reply.code(204).send();
  });
}
