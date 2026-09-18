import type { AuditEvent } from './types/domain.js';

export const AUDIT_ACTIONS = [
  'client.created',
  'client.staff_assigned',
  'document.requirement_added',
  'document.uploaded',
  'document.reuploaded',
  'review.started',
  'review.approved',
  'review.correction_requested',
  'access.denied',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_META: Record<AuditAction, { label: string; tone: 'default' | 'accent' | 'amber' | 'red' | 'green' }> = {
  'client.created': { label: 'Client created', tone: 'default' },
  'client.staff_assigned': { label: 'Staff assigned', tone: 'default' },
  'document.requirement_added': { label: 'Document requested', tone: 'default' },
  'document.uploaded': { label: 'Uploaded', tone: 'accent' },
  'document.reuploaded': { label: 'Uploaded again', tone: 'accent' },
  'review.started': { label: 'Review started', tone: 'amber' },
  'review.approved': { label: 'Approved', tone: 'green' },
  'review.correction_requested': { label: 'Correction requested', tone: 'red' },
  'access.denied': { label: 'Access denied', tone: 'red' },
};

function metaString(event: Pick<AuditEvent, 'metadata'>, key: string): string | null {
  const value = event.metadata?.[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

/** Plain-English sentence for an event, e.g. "Aman Verma approved Bank_Statement.pdf". */
export function describeAuditEvent(
  event: Pick<AuditEvent, 'action' | 'actor_name' | 'client_name' | 'document_name' | 'file_name' | 'metadata'>,
): string {
  const who = event.actor_name;
  const doc = event.document_name ?? 'a document';
  const file = event.file_name ? ` (${event.file_name})` : '';
  const version = metaString(event, 'versionNo');

  switch (event.action) {
    case 'client.created':
      return `${who} created client ${event.client_name ?? ''}`.trim();
    case 'client.staff_assigned':
      return `${who} assigned ${metaString(event, 'assigneeName') ?? 'a staff member'} to ${event.client_name ?? 'a client'}`;
    case 'document.requirement_added':
      return `${who} requested ${doc} from ${event.client_name ?? 'the client'}`;
    case 'document.uploaded':
      return `${who} uploaded ${doc}${file}`;
    case 'document.reuploaded':
      return `${who} uploaded a revised ${doc}${file}${version ? ` — version ${version}` : ''}`;
    case 'review.started':
      return `${who} started reviewing ${doc}${file}`;
    case 'review.approved':
      return `${who} approved ${doc}${file}`;
    case 'review.correction_requested':
      return `${who} requested a correction on ${doc}${file}`;
    case 'access.denied':
      return `${who} tried to open a ${metaString(event, 'resourceType') ?? 'resource'} outside their access — blocked`;
  }
}
