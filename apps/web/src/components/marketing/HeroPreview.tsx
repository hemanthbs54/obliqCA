import { Fragment } from 'react';

const ROWS = [
  { name: 'Sunrise Textiles Pvt Ltd', status: 'Overdue', tone: 'red' as const },
  { name: 'Kiran Enterprises', status: 'Missing docs', tone: 'orange' as const },
  { name: 'Meera & Co', status: 'Due soon', tone: 'amber' as const },
  { name: 'Arjun Rao', status: 'On track', tone: 'green' as const },
];

const DOT_CLASS: Record<string, string> = {
  red: 'bg-status-red',
  orange: 'bg-status-orange',
  amber: 'bg-status-amber',
  green: 'bg-status-green',
};

const TEXT_CLASS: Record<string, string> = {
  red: 'text-status-red',
  orange: 'text-status-orange',
  amber: 'text-status-amber',
  green: 'text-status-green',
};

/** A CSS-built preview of the compliance dashboard — no screenshot asset needed. */
export function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-3xl">
      <div
        className="pointer-events-none absolute -inset-x-10 -top-10 -z-10 h-72 opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(50% 100% at 50% 0%, hsl(var(--color-accent) / 0.25), transparent 70%)',
        }}
      />
      <div className="overflow-hidden rounded-2xl border border-base-border bg-base-raised shadow-2xl shadow-black/40">
        <div className="flex items-center gap-1.5 border-b border-base-border/80 bg-base/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-status-red/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-status-amber/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-status-green/70" />
          <span className="ml-3 text-xs text-ink-faint">app.obliq.io/dashboard</span>
        </div>
        <div className="grid gap-px bg-base-border/60 sm:grid-cols-[1.4fr_repeat(2,1fr)]">
          <div className="bg-base-raised px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Client
          </div>
          <div className="hidden bg-base-raised px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint sm:block">
            Status
          </div>
          <div className="hidden bg-base-raised px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint sm:block">
            Next due
          </div>
          {ROWS.map((row) => (
            <Fragment key={row.name}>
              <div className="bg-base-raised px-4 py-3 text-sm text-ink">{row.name}</div>
              <div className="hidden items-center gap-2 bg-base-raised px-4 py-3 text-sm sm:flex">
                <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[row.tone]}`} />
                <span className={TEXT_CLASS[row.tone]}>{row.status}</span>
              </div>
              <div className="hidden bg-base-raised px-4 py-3 text-sm text-ink-muted sm:block">
                {row.tone === 'green' ? '—' : '20 Aug'}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
