import Fastify, { type FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { loggerConfig } from './utils/logger.js';

import supabasePlugin from './plugins/supabase.js';
import corsPlugin from './plugins/cors.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import swaggerPlugin from './plugins/swagger.js';
import authPlugin from './plugins/auth.js';

import meRoutes from './modules/me/me.routes.js';
import clientsRoutes from './modules/clients/clients.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import queueRoutes from './modules/queue/queue.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

export async function buildApp(opts: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: opts.logger === false ? false : loggerConfig });

  // Order matters: auth is registered last so request.user / request.db
  // exist for every route registered after it.
  await fastify.register(errorHandlerPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(supabasePlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(multipart, { limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 } });
  await fastify.register(authPlugin);

  fastify.get('/health', async () => ({ status: 'ok' }));

  await fastify.register(meRoutes);
  await fastify.register(clientsRoutes);
  await fastify.register(documentsRoutes);
  await fastify.register(queueRoutes);
  await fastify.register(auditRoutes);

  return fastify;
}
