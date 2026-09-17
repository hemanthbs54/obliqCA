import type { AuditAction } from '../audit.js';
import type { DocumentStatus, MemberRole } from '../workflow.js';
import type { AuditEvent, Client, DocumentRecord, DocumentVersion, ReviewDecision } from './domain.js';

/** Request/response contracts shared by apps/api and apps/web. */

export interface PersonRef {
  id: string;
  full_name: string;
}

export interface MeResponse {
  user: { id: string; email: string | null; full_name: string };
  firm: { id: string; name: string };
  role: MemberRole;
}

export interface FirmMember extends PersonRef {
  email: string;
  role: MemberRole;
}

export type DocumentStatusCounts = Record<DocumentStatus, number>;

export interface ClientSummary extends Client {
  document_counts: DocumentStatusCounts;
  total_documents: number;
  assigned_staff: PersonRef[];
}

export interface ClientDetail extends ClientSummary {
  documents: DocumentListItem[];
}

export interface CreateClientRequest {
  name: string;
  pan?: string | null;
  gstin?: string | null;
  documentNames: string[];
}

export interface DocumentVersionWithUploader extends DocumentVersion {
  uploaded_by_profile: PersonRef | null;
}

export interface DocumentListItem extends DocumentRecord {
  current_version: DocumentVersionWithUploader | null;
  reviewer: PersonRef | null;
}

export interface ReviewDecisionWithReviewer extends ReviewDecision {
  reviewer: PersonRef | null;
}

export interface DocumentDetail extends DocumentListItem {
  client: Pick<Client, 'id' | 'name'>;
  versions: DocumentVersionWithUploader[];
  decisions: ReviewDecisionWithReviewer[];
}

export interface QueueItem extends DocumentListItem {
  client: Pick<Client, 'id' | 'name'>;
}

export interface QueueResponse {
  role: MemberRole;
  items: QueueItem[];
}

export interface ReviewActionRequest {
  expectedRowVersion: number;
}

export interface RequestCorrectionRequest extends ReviewActionRequest {
  comment: string;
}

export interface ApproveRequest extends ReviewActionRequest {
  comment?: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresInSeconds: number;
}

export interface AuditEventFilters {
  clientId?: string;
  documentId?: string;
  actorId?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
  beforeSeq?: number;
  limit?: number;
}

export interface AuditEventPage {
  events: AuditEvent[];
  nextBeforeSeq: number | null;
}

export interface AuditChainVerification {
  ok: boolean;
  events: number;
  firstBrokenSeq: number | null;
  headHash: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
}
