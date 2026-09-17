import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';

const STEPS = [
  { title: 'Request', body: 'Create a client and pick the audit documents you need: bank statement, sales and purchase registers, GST returns.' },
  { title: 'Upload', body: 'Assigned staff upload each file. Every upload is kept as a new version with its SHA-256 fingerprint.' },
  { title: 'Review', body: 'A reviewer approves it or requests a correction with a reason. The uploader can never approve their own file.' },
  { title: 'Trace', body: 'Every action lands in an append-only, hash-chained audit log that nobody can edit, not even an admin.' },
];

const GUARANTEES = [
  { title: 'Firm isolation in the database', body: 'Row Level Security scopes every query to your firm. Another firm’s client simply does not exist for you.' },
  { title: 'Roles enforced server-side', body: 'Staff upload, reviewers decide. Hiding a button is never the check: the API and database both verify.' },
  { title: 'Tamper-evident history', body: 'Audit events can’t be updated or deleted, and a hash chain proves nothing was altered.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Link href="/login">
          <Button variant="secondary" size="sm">
            Log in
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 sm:py-24">
          <p className="text-sm font-medium text-accent">Audit document review for CA firms</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Replace WhatsApp, Excel and email follow-ups with one traceable review workflow.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-muted">
            Collect client documents, review them, request corrections and approve, with a complete history of who did what, when, and why.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="lg">Try the demo</Button>
            </Link>
          </div>
        </section>

        <section aria-labelledby="how-heading" className="border-t border-base-border py-14">
          <h2 id="how-heading" className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            How it works
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-base-border bg-base-raised p-5">
                <span className="text-xs font-semibold text-accent">0{i + 1}</span>
                <h3 className="mt-2 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="trust-heading" className="border-t border-base-border py-14">
          <h2 id="trust-heading" className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Built for audit evidence
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {GUARANTEES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-base-border p-5">
                <h3 className="font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-base-border px-6 py-6 text-sm text-ink-faint">
        Obliq · evaluation prototype for OBLIQ-in
      </footer>
    </div>
  );
}
