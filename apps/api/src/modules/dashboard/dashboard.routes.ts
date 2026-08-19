import type { FastifyInstance } from 'fastify';
import { getDashboardSummary } from './dashboard.service.js';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/dashboard/summary', async (request) => {
    return getDashboardSummary(fastify.supabaseAdmin, request.user.id);
  });
}
