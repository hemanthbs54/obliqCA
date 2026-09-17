import type { FastifyRequest } from 'fastify';
import { ApiError } from './errors.js';

/**
 * RLS returned nothing for an ID the caller asked for. Respond 404 whether
 * the row is missing or belongs to someone else (never reveal which), and
 * let the database record an access.denied event if it was the latter.
 */
export async function notFound(
  request: FastifyRequest,
  resourceType: 'client' | 'document',
  resourceId: string,
): Promise<never> {
  const { error } = await request.db.rpc('log_access_denied', {
    p_resource_type: resourceType,
    p_resource_id: resourceId,
  });
  if (error) request.log.warn({ err: error, resourceType, resourceId }, 'failed to record access.denied');

  throw new ApiError(404, `${resourceType === 'client' ? 'Client' : 'Document'} not found`);
}
