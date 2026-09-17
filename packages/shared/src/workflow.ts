/**
 * Document review state machine, mirrored from the database workflow
 * functions (supabase/migrations/0004_workflow_functions.sql).
 *
 * The database is the source of truth and enforces every rule here; this
 * module exists so the UI only offers actions that will succeed, and so the
 * rules have fast unit tests. Frontend hiding a button is not security.
 */

export const MEMBER_ROLES = ['staff', 'reviewer', 'partner'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const DOCUMENT_STATUSES = [
  'pending',
  'uploaded',
  'under_review',
  'correction_required',
  'approved',
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type StatusTone = 'default' | 'accent' | 'amber' | 'red' | 'green';

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; tone: StatusTone; hint: string }> = {
  pending: { label: 'Pending', tone: 'default', hint: 'Waiting for the client file to be uploaded' },
  uploaded: { label: 'Uploaded', tone: 'accent', hint: 'Ready for a reviewer to pick up' },
  under_review: { label: 'Under review', tone: 'amber', hint: 'A reviewer is checking this document' },
  correction_required: { label: 'Correction required', tone: 'red', hint: 'Staff must upload a corrected file' },
  approved: { label: 'Approved', tone: 'green', hint: 'Reviewed and accepted' },
};

export const DOCUMENT_ACTIONS = ['upload', 'start_review', 'approve', 'request_correction'] as const;
export type DocumentAction = (typeof DOCUMENT_ACTIONS)[number];

export const DOCUMENT_TRANSITIONS: Record<
  DocumentAction,
  { from: readonly DocumentStatus[]; to: DocumentStatus; roles: readonly MemberRole[] }
> = {
  upload: { from: ['pending', 'uploaded', 'correction_required'], to: 'uploaded', roles: ['staff', 'partner'] },
  start_review: { from: ['uploaded'], to: 'under_review', roles: ['reviewer', 'partner'] },
  approve: { from: ['under_review'], to: 'approved', roles: ['reviewer', 'partner'] },
  request_correction: { from: ['under_review'], to: 'correction_required', roles: ['reviewer', 'partner'] },
};

export const MIN_CORRECTION_COMMENT_LENGTH = 10;

export interface DocumentActionContext {
  role: MemberRole;
  userId: string;
  status: DocumentStatus;
  /** Reviewer who started the review, if any. */
  reviewerId: string | null;
  /** Uploader of the version currently attached to the document. */
  currentVersionUploadedBy: string | null;
}

export type ActionAvailability = { allowed: true } | { allowed: false; reason: string };

const REVIEW_ACTIONS: readonly DocumentAction[] = ['start_review', 'approve', 'request_correction'];

export function getActionAvailability(action: DocumentAction, ctx: DocumentActionContext): ActionAvailability {
  const rule = DOCUMENT_TRANSITIONS[action];

  if (!rule.roles.includes(ctx.role)) {
    return { allowed: false, reason: `Your role (${ctx.role}) can't do this` };
  }
  if (!rule.from.includes(ctx.status)) {
    return { allowed: false, reason: `Not possible while the document is ${DOCUMENT_STATUS_META[ctx.status].label.toLowerCase()}` };
  }
  if (REVIEW_ACTIONS.includes(action) && ctx.currentVersionUploadedBy === ctx.userId) {
    return { allowed: false, reason: 'You uploaded this version, so someone else must review it (maker-checker)' };
  }
  if (
    (action === 'approve' || action === 'request_correction') &&
    ctx.reviewerId !== ctx.userId &&
    ctx.role !== 'partner'
  ) {
    return { allowed: false, reason: 'Another reviewer is reviewing this document' };
  }
  return { allowed: true };
}

export function availableActions(ctx: DocumentActionContext): DocumentAction[] {
  return DOCUMENT_ACTIONS.filter((action) => getActionAvailability(action, ctx).allowed);
}

/** Returns an error message, or null when the comment is acceptable. */
export function validateCorrectionComment(comment: string): string | null {
  return comment.trim().length < MIN_CORRECTION_COMMENT_LENGTH
    ? `Explain what needs to be corrected (at least ${MIN_CORRECTION_COMMENT_LENGTH} characters)`
    : null;
}

/** Default checklist offered when creating a client (editable in the UI). */
export const DEFAULT_REQUIRED_DOCUMENTS = [
  'Bank Statement',
  'Sales Register',
  'Purchase Register',
  'GST Return',
  'Expense Summary',
] as const;
