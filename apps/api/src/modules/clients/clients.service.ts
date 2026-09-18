import type { FastifyRequest } from 'fastify';
import {
  DOCUMENT_STATUSES,
  type Client,
  type ClientDetail,
  type ClientSummary,
  type DocumentStatus,
  type DocumentStatusCounts,
} from '@obliq/shared';
import { ApiError, toApiError, unwrap } from '../../lib/errors.js';
import { notFound } from '../../lib/access.js';
import { hydrateDocuments, loadPeople, type PeopleById } from '../../lib/hydrate.js';

function emptyCounts(): DocumentStatusCounts {
  return Object.fromEntries(DOCUMENT_STATUSES.map((s) => [s, 0])) as DocumentStatusCounts;
}

type ClientRow = Client & {
  documents: { status: DocumentStatus }[];
  client_assignments: { user_id: string }[];
};

function toSummary(row: ClientRow, people: PeopleById): ClientSummary {
  const { documents, client_assignments, ...client } = row;
  const counts = emptyCounts();
  for (const doc of documents) counts[doc.status] += 1;
  return {
    ...client,
    document_counts: counts,
    total_documents: documents.length,
    assigned_staff: client_assignments
      .map((a) => people.get(a.user_id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p)),
  };
}

const CLIENT_SELECT = '*, documents(status), client_assignments(user_id)';

/** RLS limits this to the caller's firm, and for staff to assigned clients. */
export async function listClients(request: FastifyRequest): Promise<ClientSummary[]> {
  const [rows, people] = await Promise.all([
    request.db.from('clients').select(CLIENT_SELECT).order('name').then(unwrap),
    loadPeople(request.db),
  ]);
  return (rows as unknown as ClientRow[]).map((row) => toSummary(row, people));
}

export async function getClient(request: FastifyRequest, clientId: string): Promise<ClientDetail> {
  const row = unwrap(await request.db.from('clients').select(CLIENT_SELECT).eq('id', clientId).maybeSingle());
  if (!row) return notFound(request, 'client', clientId);

  const people = await loadPeople(request.db);
  const documents = unwrap(
    await request.db.from('documents').select('*').eq('client_id', clientId).order('created_at').order('name'),
  );

  return {
    ...toSummary(row as unknown as ClientRow, people),
    documents: await hydrateDocuments(request.db, documents, people),
  };
}

export async function createClient(
  request: FastifyRequest,
  input: { name: string; pan?: string | null; gstin?: string | null; documentNames: string[] },
): Promise<ClientDetail> {
  const { data: client, error } = await request.db
    .rpc('create_client', {
      p_name: input.name,
      p_pan: input.pan ?? undefined,
      p_gstin: input.gstin ?? undefined,
      p_document_names: input.documentNames,
    });
  if (error) throw toApiError(error);
  if (!client) throw new ApiError(500, 'Client was not created');
  return getClient(request, client.id);
}

export async function assignStaff(request: FastifyRequest, clientId: string, userId: string): Promise<ClientDetail> {
  unwrap(await request.db.rpc('assign_staff', { p_client_id: clientId, p_user_id: userId }));
  return getClient(request, clientId);
}

export async function addRequiredDocument(request: FastifyRequest, clientId: string, name: string): Promise<ClientDetail> {
  const { error } = await request.db.rpc('add_required_document', { p_client_id: clientId, p_name: name });
  if (error?.code === 'PT404') return notFound(request, 'client', clientId);
  if (error) unwrap({ data: null, error });
  return getClient(request, clientId);
}
