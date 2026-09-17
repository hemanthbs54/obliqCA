'use client';

import { useState } from 'react';
import { DOCUMENT_ACTIONS, getActionAvailability, type DocumentAction, type DocumentDetail, type MeResponse } from '@obliq/shared';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useReviewCommand, useUploadVersion } from '@/hooks/queries';
import { ApiError, errorMessage } from '@/lib/api';
import { ApproveDialog, CorrectionDialog, UploadDialog } from './ReviewDialogs';

type OpenDialog = 'upload' | 'approve' | 'correction' | null;

/**
 * Shows only the actions the caller's role and the document's state allow.
 * This is a convenience, not the security boundary: the API and database
 * re-validate every action.
 */
export function DocumentActions({ document, me }: { document: DocumentDetail; me: Pick<MeResponse, 'role' | 'user'> }) {
  const toast = useToast();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const review = useReviewCommand(document.id);
  const upload = useUploadVersion(document.id);

  const context = {
    role: me.role,
    userId: me.user.id,
    status: document.status,
    reviewerId: document.reviewer_id,
    currentVersionUploadedBy: document.current_version?.uploaded_by ?? null,
  };
  const availability = Object.fromEntries(DOCUMENT_ACTIONS.map((a) => [a, getActionAvailability(a, context)])) as Record<
    DocumentAction,
    ReturnType<typeof getActionAvailability>
  >;

  function onError(error: unknown) {
    const conflict = error instanceof ApiError && error.statusCode === 409;
    toast(conflict ? `${error.message} The page has been refreshed.` : errorMessage(error), 'error');
  }

  const expectedRowVersion = document.row_version;
  const visible = DOCUMENT_ACTIONS.filter((a) => availability[a].allowed);
  // Explain why nothing is available for this user (e.g. maker-checker), rather than showing an empty box.
  const blockedReason = DOCUMENT_ACTIONS.map((a) => availability[a])
    .filter((a): a is { allowed: false; reason: string } => !a.allowed)
    .find((a) => a.reason.includes('maker-checker') || a.reason.includes('Another reviewer'))?.reason;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availability.upload.allowed && (
          <Button onClick={() => setDialog('upload')}>
            {document.status === 'correction_required' ? 'Upload corrected file' : document.status === 'pending' ? 'Upload file' : 'Replace file'}
          </Button>
        )}
        {availability.start_review.allowed && (
          <Button
            disabled={review.isPending}
            onClick={() =>
              review.mutate(
                { kind: 'start-review', expectedRowVersion },
                { onSuccess: () => toast('Review started', 'success'), onError },
              )
            }
          >
            Start review
          </Button>
        )}
        {availability.approve.allowed && <Button onClick={() => setDialog('approve')}>Approve</Button>}
        {availability.request_correction.allowed && (
          <Button variant="danger" onClick={() => setDialog('correction')}>
            Request correction
          </Button>
        )}
      </div>

      {blockedReason ? (
        <p className="text-sm text-status-amber">{blockedReason}</p>
      ) : (
        visible.length === 0 && (
          <p className="text-sm text-ink-muted">
            {document.status === 'approved' ? 'This document is approved. No further action needed.' : 'No actions available for your role right now.'}
          </p>
        )
      )}

      {dialog === 'upload' && (
        <UploadDialog
          open={dialog === 'upload'}
          onClose={() => setDialog(null)}
          documentName={document.name}
          pending={upload.isPending}
          isCorrection={document.status === 'correction_required'}
          correctionReason={document.last_review_comment}
          onSubmit={(file, responseNote) =>
            upload.mutate(
              { file, responseNote },
              {
                onSuccess: () => {
                  setDialog(null);
                  toast(`${file.name} uploaded`, 'success');
                },
                onError,
              },
            )
          }
        />
      )}
      {dialog === 'approve' && (
        <ApproveDialog
          open={dialog === 'approve'}
          onClose={() => setDialog(null)}
          documentName={document.name}
          pending={review.isPending}
          onSubmit={(comment) =>
            review.mutate(
              { kind: 'approve', expectedRowVersion, comment },
              {
                onSuccess: () => {
                  setDialog(null);
                  toast(`${document.name} approved`, 'success');
                },
                onError: (error) => {
                  setDialog(null);
                  onError(error);
                },
              },
            )
          }
        />
      )}
      {dialog === 'correction' && (
        <CorrectionDialog
          open={dialog === 'correction'}
          onClose={() => setDialog(null)}
          documentName={document.name}
          pending={review.isPending}
          onSubmit={(comment) =>
            review.mutate(
              { kind: 'request-correction', expectedRowVersion, comment },
              {
                onSuccess: () => {
                  setDialog(null);
                  toast('Correction requested', 'success');
                },
                onError: (error) => {
                  setDialog(null);
                  onError(error);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}
