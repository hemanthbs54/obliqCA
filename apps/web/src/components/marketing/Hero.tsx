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
          Every audit document{' '}
          <span className="bg-gradient-to-br from-accent to-emerald-300 bg-clip-text text-transparent">
            reviewed, corrected and traceable
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-muted">
          Replace WhatsApp, Excel, email and Drive follow-ups with one workflow: collect client
          documents, review them, request corrections, approve, and keep a history nobody can edit.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg">Try the demo</Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="secondary">
              See how it works
            </Button>
          </a>
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          No sign-up needed · Demo accounts for two firms with synthetic data
        </p>
      </div>
      <div className="px-6">
        <HeroPreview />
      </div>
    </section>
  );
}
