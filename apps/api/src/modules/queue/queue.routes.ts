import type { FastifyInstance } from 'fastify';
import type { DocumentStatus, QueueItem, QueueResponse } from '@obliq/shared';
import { unwrap } from '../../lib/errors.js';
import { hydrateDocuments, loadPeople } from '../../lib/hydrate.js';

/**
 * "Needs your action": staff see documents waiting on an upload (new or a
 * correction), reviewers see documents waiting on a review decision. Oldest
 * first, so nothing sits at the bottom forever.
 */
export default async function queueRoutes(fastify: FastifyInstance) {
  fastify.get('/api/queue', async (request): Promise<QueueResponse> => {
    const { db, user } = request;
    // Partners both upload and review, so their queue is the union of both.
    const statuses: DocumentStatus[] =
      user.role === 'staff'
        ? ['correction_required', 'pending']
        : user.role === 'partner'
          ? ['correction_required', 'under_review', 'uploaded', 'pending']
          : ['uploaded', 'under_review'];

    const [rows, people, clients] = await Promise.all([
      db.from('documents').select('*').in('status', statuses).order('updated_at', { ascending: true }).then(unwrap),
      loadPeople(db),
      db.from('clients').select('id, name').then(unwrap),
    ]);

    // Reviewers only see in-progress reviews that are theirs; partners see all.
    const visible = rows.filter(
      (doc) => !(user.role === 'reviewer' && doc.status === 'under_review' && doc.reviewer_id !== user.id),
    );

    const clientsById = new Map(clients.map((c) => [c.id, c]));
    const hydrated = await hydrateDocuments(db, visible, people);
    const priority: Record<DocumentStatus, number> = {
      correction_required: 0,
      under_review: 0,
      uploaded: 1,
      pending: 1,
      approved: 2,
    };

    const items: QueueItem[] = hydrated
      .map((doc) => ({ ...doc, client: clientsById.get(doc.client_id) ?? { id: doc.client_id, name: 'Unknown client' } }))
      .sort((a, b) => priority[a.status] - priority[b.status]);

    return { role: user.role, items };
  });
}
