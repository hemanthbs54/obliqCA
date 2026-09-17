import type { FastifyInstance } from 'fastify';
import type { FirmMember, MeResponse } from '@obliq/shared';
import { requireCapability } from '../../plugins/auth.js';
import { unwrap } from '../../lib/errors.js';

export default async function meRoutes(fastify: FastifyInstance) {
  fastify.get('/api/me', async (request): Promise<MeResponse> => {
    const { user } = request;
    return {
      user: { id: user.id, email: user.email, full_name: user.fullName },
      firm: { id: user.firmId, name: user.firmName },
      role: user.role,
    };
  });

  // Firm members, for assigning staff to clients.
  fastify.get(
    '/api/members',
    { preHandler: requireCapability('client.assign_staff') },
    async (request): Promise<FirmMember[]> => {
      const rows = unwrap(
        await request.db
          .from('firm_memberships')
          .select('role, profile:profiles(id, full_name, email)')
          .order('role'),
      );
      return rows
        .filter((row) => row.profile)
        .map((row) => ({ ...row.profile!, role: row.role }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
  );
}
