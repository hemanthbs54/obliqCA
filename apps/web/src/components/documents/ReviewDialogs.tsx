'use client';

import { useState, type FormEvent } from 'react';
import { MIN_CORRECTION_COMMENT_LENGTH, validateCorrectionComment } from '@obliq/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  documentName: string;
  pending: boolean;
}

export function CorrectionDialog({ open, onClose, documentName, pending, onSubmit }: DialogProps & { onSubmit: (comment: string) => void }) {
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);
  const error = validateCorrectionComment(comment);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!error) onSubmit(comment.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title="Request correction" description={`Tell staff exactly what's wrong with ${documentName}. This reason is saved permanently in the audit history.`}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="correction-comment">Reason</Label>
          <Textarea
            id="correction-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Page 3 is missing. Please upload the complete bank statement."
            aria-invalid={touched && Boolean(error)}
            aria-describedby="correction-help"
            maxLength={2000}
          />
          <p id="correction-help" className={touched && error ? 'mt-1 text-xs text-status-red' : 'mt-1 text-xs text-ink-faint'}>
            {touched && error ? error : `At least ${MIN_CORRECTION_COMMENT_LENGTH} characters.`}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} data-close>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? 'Sending…' : 'Request correction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ApproveDialog({ open, onClose, documentName, pending, onSubmit }: DialogProps & { onSubmit: (comment?: string) => void }) {
  const [comment, setComment] = useState('');
  return (
    <Modal open={open} onClose={onClose} title={`Approve ${documentName}?`} description="Approval is final for this version and is recorded in the audit history.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(comment.trim() || undefined);
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="approve-comment">Comment (optional)</Label>
          <Textarea id="approve-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Balances reconcile with the ledger." maxLength={2000} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} data-close>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Approving…' : 'Approve'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.csv,.xls,.xlsx';

export function UploadDialog({
  open,
  onClose,
  documentName,
  pending,
  isCorrection,
  correctionReason,
  onSubmit,
}: DialogProps & { isCorrection: boolean; correctionReason: string | null; onSubmit: (file: File, note?: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setError('Choose a file to upload');
    if (file.size > 15 * 1024 * 1024) return setError('Files must be 15 MB or smaller');
    onSubmit(file, note.trim() || undefined);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCorrection ? `Upload corrected ${documentName}` : `Upload ${documentName}`}
      description="PDF, image, CSV or Excel, up to 15 MB. Previous versions are kept."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isCorrection && correctionReason && (
          <div className="rounded-xl border border-status-red/30 bg-status-red/5 px-3 py-2 text-sm">
            <span className="block text-[11px] uppercase tracking-wide text-status-red">Reviewer asked for</span>
            <span className="text-ink">{correctionReason}</span>
          </div>
        )}
        <div>
          <Label htmlFor="upload-file">File</Label>
          <input
            id="upload-file"
            type="file"
            accept={ACCEPT}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
            }}
            className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent"
          />
        </div>
        <div>
          <Label htmlFor="upload-note">{isCorrection ? 'What did you fix? (optional)' : 'Note (optional)'}</Label>
          <Textarea id="upload-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} className="min-h-16" />
        </div>
        {error && <p className="text-sm text-status-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} data-close>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
