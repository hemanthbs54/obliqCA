import type { FastifyRequest } from 'fastify';
import {
  AUDIT_ACTION_META,
  describeAuditEvent,
  DOCUMENT_STATUS_META,
  type AuditChainVerification,
  type AuditEvent,
  type AuditEventPage,
  type TypedSupabaseClient,
} from '@obliq/shared';
import { unwrap } from '../../lib/errors.js';
import { notFound } from '../../lib/access.js';
import type { AuditFilters } from './audit.schema.js';

function filteredQuery(db: TypedSupabaseClient, filters: Omit<AuditFilters, 'limit' | 'beforeSeq'>) {
  let query = db.from('audit_events').select('*');
  if (filters.clientId) query = query.eq('client_id', filters.clientId);
  if (filters.documentId) query = query.eq('document_id', filters.documentId);
  if (filters.actorId) query = query.eq('actor_id', filters.actorId);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.from) query = query.gte('occurred_at', filters.from);
  if (filters.to) query = query.lte('occurred_at', filters.to);
  return query;
}

/** Firm audit log, newest first, keyset-paginated on the chain sequence. */
export async function listEvents(request: FastifyRequest, filters: AuditFilters): Promise<AuditEventPage> {
  let query = filteredQuery(request.db, filters).order('seq', { ascending: false }).limit(filters.limit + 1);
  if (filters.beforeSeq) query = query.lt('seq', filters.beforeSeq);

  const rows = unwrap(await query) as AuditEvent[];
  const hasMore = rows.length > filters.limit;
  const events = hasMore ? rows.slice(0, filters.limit) : rows;
  return { events, nextBeforeSeq: hasMore ? events[events.length - 1]!.seq : null };
}

/** One document's history, oldest first — reads like the brief's example timeline. */
export async function listDocumentEvents(request: FastifyRequest, documentId: string): Promise<AuditEvent[]> {
  const doc = unwrap(await request.db.from('documents').select('id').eq('id', documentId).maybeSingle());
  if (!doc) return notFound(request, 'document', documentId);

  return unwrap(
    await request.db
      .from('audit_events')
      .select('*')
      .eq('document_id', documentId)
      .order('seq', { ascending: true }),
  ) as AuditEvent[];
}

export async function verifyChain(request: FastifyRequest): Promise<AuditChainVerification> {
  return unwrap(await request.db.rpc('verify_audit_chain')) as unknown as AuditChainVerification;
}

const CSV_COLUMNS = [
  'seq',
  'occurred_at_utc',
  'actor',
  'actor_role',
  'action',
  'client',
  'document',
  'file',
  'from_status',
  'to_status',
  'comment',
  'summary',
  'hash',
] as const;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // Neutralise spreadsheet formula injection (=, +, -, @ at the start).
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function eventsToCsv(events: AuditEvent[]): string {
  const lines = events.map((e) =>
    [
      e.seq,
      e.occurred_at,
      e.actor_name,
      e.actor_role,
      AUDIT_ACTION_META[e.action].label,
      e.client_name,
      e.document_name,
      e.file_name,
      e.from_status ? DOCUMENT_STATUS_META[e.from_status].label : '',
      e.to_status ? DOCUMENT_STATUS_META[e.to_status].label : '',
      e.comment,
      describeAuditEvent(e),
      e.hash,
    ]
      .map(csvCell)
      .join(','),
  );
  return [CSV_COLUMNS.join(','), ...lines].join('\r\n') + '\r\n';
}

export async function exportCsv(request: FastifyRequest, filters: AuditFilters): Promise<string> {
  const rows = unwrap(
    await filteredQuery(request.db, filters).order('seq', { ascending: true }).limit(10_000),
  ) as AuditEvent[];
  return eventsToCsv(rows);
}
