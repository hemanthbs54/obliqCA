import type { DocumentStatusCounts } from '@obliq/shared';

/** Approved share of required documents, with open corrections called out. */
export function ClientProgress({ counts, total }: { counts: DocumentStatusCounts; total: number }) {
  const approved = counts.approved;
  const percent = total === 0 ? 0 : Math.round((approved / total) * 100);

  return (
    <div className="min-w-40">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          {approved}/{total} approved
        </span>
        {counts.correction_required > 0 && <span className="text-status-red">{counts.correction_required} to correct</span>}
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-base-border/60"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Documents approved"
      >
        <div className="h-full rounded-full bg-status-green" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
