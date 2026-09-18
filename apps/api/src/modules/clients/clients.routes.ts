import type { FastifyInstance } from 'fastify';
import { requireCapability } from '../../plugins/auth.js';
import { addDocumentBody, assignStaffBody, clientIdParams, createClientBody } from './clients.schema.js';
import * as clientsService from './clients.service.js';

export default async function clientsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/clients', async (request) => clientsService.listClients(request));

  fastify.post('/api/clients', { preHandler: requireCapability('client.create') }, async (request, reply) => {
    const body = createClientBody.parse(request.body);
    return reply.code(201).send(await clientsService.createClient(request, body));
  });

  fastify.get('/api/clients/:id', async (request) => {
    const { id } = clientIdParams.parse(request.params);
    return clientsService.getClient(request, id);
  });

  fastify.post(
    '/api/clients/:id/assignments',
    { preHandler: requireCapability('client.assign_staff') },
    async (request) => {
      const { id } = clientIdParams.parse(request.params);
      const { userId } = assignStaffBody.parse(request.body);
      return clientsService.assignStaff(request, id, userId);
    },
  );

  fastify.post(
    '/api/clients/:id/documents',
    { preHandler: requireCapability('document.add_requirement') },
    async (request, reply) => {
      const { id } = clientIdParams.parse(request.params);
      const { name } = addDocumentBody.parse(request.body);
      return reply.code(201).send(await clientsService.addRequiredDocument(request, id, name));
    },
  );
}
