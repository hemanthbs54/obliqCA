import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as agentService from './agent.service.js';

const runBody = z.object({ clientId: z.string().uuid() });
const idParams = z.object({ id: z.string().uuid() });

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.post('/api/agent/run', async (request) => {
    const { clientId } = runBody.parse(request.body);
    const result = await agentService.runComplianceAgent(fastify.supabaseAdmin, request.user.id, clientId);
    return {
      agentRunId: result.agentRunId,
      status: result.evaluation.status,
      flags: result.evaluation.flags,
      nextDueDate: result.evaluation.nextDueDate,
      nextDueFilingType: result.evaluation.nextDueFilingType,
      narrative: result.narrative,
    };
  });

  fastify.post('/api/agent/run-all', async (request) => {
    const results = await agentService.runComplianceAgentForAllClients(fastify.supabaseAdmin, request.user.id);
    return results.map((r) => ({
      agentRunId: r.agentRunId,
      status: r.evaluation.status,
      narrative: r.narrative,
    }));
  });

  fastify.get('/api/agent/runs/:id', async (request) => {
    const { id } = idParams.parse(request.params);
    return agentService.getAgentRun(fastify.supabaseAdmin, request.user.id, id);
  });

  fastify.get('/api/clients/:id/agent/runs', async (request) => {
    const { id } = idParams.parse(request.params);
    return agentService.listAgentRunsForClient(fastify.supabaseAdmin, request.user.id, id);
  });
}
