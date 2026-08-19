import Fastify, { type FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { loggerConfig } from './utils/logger.js';
import './ai/index.js';

import supabasePlugin from './plugins/supabase.js';
import corsPlugin from './plugins/cors.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import swaggerPlugin from './plugins/swagger.js';
import authPlugin from './plugins/auth.js';

import profilesRoutes from './modules/profiles/profiles.routes.js';
import clientsRoutes from './modules/clients/clients.routes.js';
import filingsRoutes from './modules/filings/filings.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';
import ragRoutes from './modules/rag/rag.routes.js';
import agentRoutes from './modules/agent/agent.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: loggerConfig });

  // Plugins — order matters: supabase/cors/error-handler/swagger first, auth last
  // so request.user is available to every route registered after it.
  await fastify.register(errorHandlerPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(supabasePlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } });
  await fastify.register(authPlugin);

  fastify.get('/health', async () => ({ status: 'ok' }));

  fastify.get('/api/ai/status', async () => ({
    chatProvider: env.AI_CHAT_PROVIDER ?? env.AI_PROVIDER,
    embeddingProvider: env.AI_EMBEDDING_PROVIDER ?? env.AI_PROVIDER,
    extractionProvider: env.AI_EXTRACTION_PROVIDER ?? env.AI_PROVIDER,
    mockMode: [env.AI_CHAT_PROVIDER, env.AI_EMBEDDING_PROVIDER, env.AI_EXTRACTION_PROVIDER, env.AI_PROVIDER]
      .filter(Boolean)
      .every((p) => p === 'mock' || p === undefined),
  }));

  await fastify.register(profilesRoutes);
  await fastify.register(clientsRoutes);
  await fastify.register(filingsRoutes);
  await fastify.register(tasksRoutes);
  await fastify.register(documentsRoutes);
  await fastify.register(ragRoutes);
  await fastify.register(agentRoutes);
  await fastify.register(dashboardRoutes);

  return fastify;
}
