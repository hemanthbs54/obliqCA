import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DocumentDetail, MemberRole } from '@obliq/shared';

const { mutateReview, mutateUpload } = vi.hoisted(() => ({ mutateReview: vi.fn(), mutateUpload: vi.fn() }));

vi.mock('@/hooks/queries', () => ({
  useReviewCommand: () => ({ mutate: mutateReview, isPending: false }),
  useUploadVersion: () => ({ mutate: mutateUpload, isPending: false }),
}));

import { DocumentActions } from '@/components/documents/DocumentActions';
import { ToastProvider } from '@/components/ui/Toast';

const STAFF_ID = 'staff-1';
const REVIEWER_ID = 'reviewer-1';

function makeDocument(overrides: Partial<DocumentDetail>): DocumentDetail {
  return {
    id: 'doc-1',
    firm_id: 'firm-a',
    client_id: 'client-1',
    name: 'Bank Statement',
    status: 'uploaded',
    current_version_id: 'v1',
    reviewer_id: null,
    last_review_comment: null,
    row_version: 3,
    created_by: null,
    created_at: '2026-09-17T04:50:00Z',
    updated_at: '2026-09-17T04:50:00Z',
    current_version: {
      id: 'v1',
      firm_id: 'firm-a',
      document_id: 'doc-1',
      version_no: 1,
      storage_path: 'x',
      file_name: 'Bank_Statement.pdf',
      mime_type: 'application/pdf',
      size_bytes: 1200,
      sha256: 'a'.repeat(64),
      response_note: null,
      uploaded_by: STAFF_ID,
      uploaded_at: '2026-09-17T04:50:00Z',
      uploaded_by_profile: { id: STAFF_ID, full_name: 'Rohit Sharma' },
    },
    reviewer: null,
    client: { id: 'client-1', name: 'ABC Traders Pvt. Ltd.' },
    versions: [],
    decisions: [],
    ...overrides,
  };
}

function renderActions(document: DocumentDetail, role: MemberRole, userId: string) {
  return render(
    <ToastProvider>
      <DocumentActions document={document} me={{ role, user: { id: userId, email: null, full_name: 'Test' } }} />
    </ToastProvider>,
  );
}

describe('DocumentActions', () => {
  beforeEach(() => {
    mutateReview.mockReset();
    mutateUpload.mockReset();
  });

  it('shows staff only the upload action', () => {
    renderActions(makeDocument({ status: 'correction_required' }), 'staff', STAFF_ID);
    expect(screen.getByRole('button', { name: 'Upload corrected file' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve|review|request correction/i })).not.toBeInTheDocument();
  });

  it('lets a reviewer start a review, quoting the row version it saw', async () => {
    renderActions(makeDocument({ status: 'uploaded' }), 'reviewer', REVIEWER_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Start review' }));
    expect(mutateReview).toHaveBeenCalledWith({ kind: 'start-review', expectedRowVersion: 3 }, expect.anything());
  });

  it('explains maker-checker instead of offering review actions on your own upload', () => {
    renderActions(makeDocument({ status: 'uploaded' }), 'partner', STAFF_ID);
    expect(screen.queryByRole('button', { name: 'Start review' })).not.toBeInTheDocument();
    expect(screen.getByText(/maker-checker/)).toBeInTheDocument();
  });

  it('requires a reason before requesting a correction', async () => {
    const user = userEvent.setup();
    renderActions(makeDocument({ status: 'under_review', reviewer_id: REVIEWER_ID }), 'reviewer', REVIEWER_ID);

    await user.click(screen.getByRole('button', { name: 'Request correction' }));
    const dialog = screen.getByRole('dialog', { name: 'Request correction' });
    await user.type(screen.getByLabelText('Reason'), 'too short');
    await user.click(within(dialog).getByRole('button', { name: 'Request correction' }));
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument();
    expect(mutateReview).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Reason'));
    await user.type(screen.getByLabelText('Reason'), 'Page 3 is missing. Please upload the complete bank statement.');
    await user.click(within(dialog).getByRole('button', { name: 'Request correction' }));
    expect(mutateReview).toHaveBeenCalledWith(
      { kind: 'request-correction', expectedRowVersion: 3, comment: 'Page 3 is missing. Please upload the complete bank statement.' },
      expect.anything(),
    );
  });

  it('offers nothing once approved', () => {
    renderActions(makeDocument({ status: 'approved' }), 'partner', REVIEWER_ID);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText(/approved/i)).toBeInTheDocument();
  });
});

