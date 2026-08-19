import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getProfile, upsertProfile } from './profiles.service.js';

const syncBody = z.object({
  firmName: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export default async function profilesRoutes(fastify: FastifyInstance) {
  fastify.get('/api/profile/me', async (request) => {
    return getProfile(fastify.supabaseAdmin, request.user.id);
  });

  fastify.post('/api/profile/sync', async (request) => {
    const body = syncBody.parse(request.body);
    return upsertProfile(fastify.supabaseAdmin, request.user.id, body);
  });

  fastify.patch('/api/profile/me', async (request) => {
    const body = syncBody.parse(request.body);
    return upsertProfile(fastify.supabaseAdmin, request.user.id, body);
  });
}
