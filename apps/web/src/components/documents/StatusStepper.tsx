import { DOCUMENT_STATUS_META, type DocumentStatus } from '@obliq/shared';
import { cn } from '@/lib/utils';

const HAPPY_PATH: DocumentStatus[] = ['pending', 'uploaded', 'under_review', 'approved'];

/**
 * Pending → Uploaded → Under review → Approved, with the correction loop
 * shown as a branch when the document is waiting on a corrected upload.
 */
export function StatusStepper({ status }: { status: DocumentStatus }) {
  const inCorrection = status === 'correction_required';
  // A correction sends the document back to "uploaded" next, so highlight up to review.
  const currentIndex = inCorrection ? 2 : HAPPY_PATH.indexOf(status);

  return (
    <div>
      <ol className="flex items-center gap-2" aria-label="Review progress">
        {HAPPY_PATH.map((step, index) => {
          const done = index < currentIndex || status === 'approved';
          const current = index === currentIndex && !inCorrection && status !== 'approved';
          return (
            <li key={step} className="flex flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-status-green bg-status-green/15 text-status-green',
                  current && 'border-accent bg-accent-muted text-accent',
                  !done && !current && 'border-base-border text-ink-faint',
                  inCorrection && index === 2 && 'border-status-red bg-status-red/15 text-status-red',
                )}
              >
                {done ? '✓' : index + 1}
              </span>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:inline',
                  done || current ? 'text-ink' : 'text-ink-faint',
                  inCorrection && index === 2 && 'text-status-red',
                )}
              >
                {DOCUMENT_STATUS_META[step].label}
              </span>
              {index < HAPPY_PATH.length - 1 && <span className="h-px flex-1 bg-base-border" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
      {inCorrection && (
        <p className="mt-3 text-xs text-status-red">
          ↺ Correction required: the next upload goes back to the reviewer.
        </p>
      )}
    </div>
  );
}
