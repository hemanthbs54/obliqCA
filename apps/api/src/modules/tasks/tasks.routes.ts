import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as tasksService from './tasks.service.js';

const clientIdParams = z.object({ id: z.string().uuid() });
const taskIdParams = z.object({ id: z.string().uuid() });
const listQuery = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
});
const updateTaskBody = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
  checklist: z.array(z.object({ label: z.string(), done: z.boolean() })).optional(),
  notes: z.string().optional(),
});

export default async function tasksRoutes(fastify: FastifyInstance) {
  fastify.get('/api/clients/:id/tasks', async (request) => {
    const { id } = clientIdParams.parse(request.params);
    const { status } = listQuery.parse(request.query);
    return tasksService.listTasksForClient(fastify.supabaseAdmin, request.user.id, id, status);
  });

  fastify.post('/api/clients/:id/tasks/generate', async (request) => {
    const { id } = clientIdParams.parse(request.params);
    return tasksService.generateTasksForClient(fastify.supabaseAdmin, request.user.id, id);
  });

  fastify.get('/api/tasks/:id', async (request) => {
    const { id } = taskIdParams.parse(request.params);
    return tasksService.getTask(fastify.supabaseAdmin, request.user.id, id);
  });

  fastify.patch('/api/tasks/:id', async (request) => {
    const { id } = taskIdParams.parse(request.params);
    const body = updateTaskBody.parse(request.body);
    return tasksService.updateTask(fastify.supabaseAdmin, request.user.id, id, body);
  });
}
