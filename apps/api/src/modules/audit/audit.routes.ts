import type { FastifyInstance } from 'fastify';
import { requireCapability } from '../../plugins/auth.js';
import { documentIdParams } from '../documents/documents.schema.js';
import { auditFiltersQuery } from './audit.schema.js';
import * as auditService from './audit.service.js';

export default async function auditRoutes(fastify: FastifyInstance) {
  const firmLogOnly = { preHandler: requireCapability('audit.view_firm_log') };

  fastify.get('/api/audit-events', firmLogOnly, async (request) => {
    const filters = auditFiltersQuery.parse(request.query);
    return auditService.listEvents(request, filters);
  });

  fastify.get('/api/audit-events/verify', firmLogOnly, async (request) => auditService.verifyChain(request));

  fastify.get('/api/audit-events/export.csv', firmLogOnly, async (request, reply) => {
    const filters = auditFiltersQuery.parse(request.query);
    const csv = await auditService.exportCsv(request, filters);
    const stamp = new Date().toISOString().slice(0, 10);
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="audit-log-${stamp}.csv"`)
      .send(csv);
  });

  // Per-document timeline. Staff may read it for their assigned clients (RLS decides).
  fastify.get('/api/documents/:id/audit-events', async (request) => {
    const { id } = documentIdParams.parse(request.params);
    return auditService.listDocumentEvents(request, id);
  });
}
