import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] opacity-40"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, hsl(var(--color-accent) / 0.25), transparent 70%)',
        }}
      />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-24 pb-20 text-center">
        <Badge tone="accent">Built for Chartered Accountant firms</Badge>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Never miss a GST, TDS, or ITR deadline again
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-muted">
          Obliq tracks every client&apos;s filing calendar, reads the documents your team uploads,
          and tells you exactly what&apos;s overdue, due soon, or missing — before your client has
          to ask.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Start free</Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="secondary">
              See how it works
            </Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          No credit card required · Runs in demo mode with sample data out of the box
        </p>
      </div>
    </section>
  );
}
