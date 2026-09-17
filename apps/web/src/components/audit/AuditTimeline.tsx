import { AUDIT_ACTION_META, describeAuditEvent, formatDate, formatTime, ROLE_META, type AuditEvent } from '@obliq/shared';
import { cn } from '@/lib/utils';

const DOT_TONE: Record<string, string> = {
  default: 'bg-ink-faint',
  accent: 'bg-accent',
  amber: 'bg-status-amber',
  red: 'bg-status-red',
  green: 'bg-status-green',
};

/**
 * Chronological history in the brief's format: when, who (and role), what
 * happened to which document, and the reason if one was given.
 */
export function AuditTimeline({ events, emptyText = 'No activity yet.' }: { events: AuditEvent[]; emptyText?: string }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyText}</p>;
  }

  let lastDate = '';
  return (
    <ol className="relative space-y-5 border-l border-base-border pl-5" aria-label="Audit history">
      {events.map((event) => {
        const date = formatDate(event.occurred_at);
        const showDate = date !== lastDate;
        lastDate = date;
        const meta = AUDIT_ACTION_META[event.action];

        return (
          <li key={event.id} className="relative">
            <span
              className={cn('absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-base-raised', DOT_TONE[meta.tone])}
              aria-hidden="true"
            />
            {showDate && <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-faint">{date}</p>}
            <p className="text-xs text-ink-muted">
              <time dateTime={event.occurred_at}>{formatTime(event.occurred_at)}</time>
              <span className="mx-1.5">·</span>
              {meta.label}
              {event.actor_role && (
                <>
                  <span className="mx-1.5">·</span>
                  {ROLE_META[event.actor_role].label}
                </>
              )}
            </p>
            <p className="mt-0.5 text-sm text-ink">{describeAuditEvent(event)}</p>
            {event.comment && (
              <blockquote className="mt-2 rounded-lg border-l-2 border-base-border bg-base/60 px-3 py-2 text-sm text-ink-muted">
                <span className="block text-[11px] uppercase tracking-wide text-ink-faint">
                  {event.action === 'review.correction_requested' ? 'Reason' : 'Note'}
                </span>
                {event.comment}
              </blockquote>
            )}
          </li>
        );
      })}
    </ol>
  );
}
