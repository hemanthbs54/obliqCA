import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HeroPreview } from './HeroPreview';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] opacity-50"
        style={{
          background:
            'radial-gradient(55% 45% at 50% 0%, hsl(var(--color-accent) / 0.28), transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--color-ink)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--color-ink)) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-8 text-center sm:pt-28">
        <Badge tone="accent">Built for Chartered Accountant firms</Badge>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-6xl">
          Never miss a{' '}
          <span className="bg-gradient-to-br from-accent to-emerald-300 bg-clip-text text-transparent">
            GST, TDS, or ITR
          </span>{' '}
          deadline again
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">
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
      <div className="px-6">
        <HeroPreview />
      </div>
    </section>
  );
}
