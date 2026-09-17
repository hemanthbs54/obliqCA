import type { AuditAction } from '../audit.js';
import type { DocumentStatus, MemberRole } from '../workflow.js';

/** Row shapes, matching supabase/migrations (snake_case, ISO timestamps). */

export interface Firm {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface FirmMembership {
  user_id: string;
  firm_id: string;
  role: MemberRole;
  created_at: string;
}

export interface Client {
  id: string;
  firm_id: string;
  name: string;
  pan: string | null;
  gstin: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ClientAssignment {
  client_id: string;
  user_id: string;
  firm_id: string;
  assigned_by: string | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  firm_id: string;
  client_id: string;
  name: string;
  status: DocumentStatus;
  current_version_id: string | null;
  reviewer_id: string | null;
  last_review_comment: string | null;
  row_version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  firm_id: string;
  document_id: string;
  version_no: number;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  response_note: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

export type ReviewDecisionType = 'approved' | 'correction_requested';

export interface ReviewDecision {
  id: string;
  firm_id: string;
  document_id: string;
  version_id: string;
  decision: ReviewDecisionType;
  comment: string | null;
  reviewer_id: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  firm_id: string;
  seq: number;
  occurred_at: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: MemberRole | null;
  action: AuditAction;
  client_id: string | null;
  client_name: string | null;
  document_id: string | null;
  document_name: string | null;
  version_id: string | null;
  file_name: string | null;
  from_status: DocumentStatus | null;
  to_status: DocumentStatus | null;
  comment: string | null;
  metadata: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}
