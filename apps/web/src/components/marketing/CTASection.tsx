import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="relative overflow-hidden rounded-2xl border border-base-border bg-base-raised px-8 py-14 text-center sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(60% 80% at 50% 100%, hsl(var(--color-accent) / 0.2), transparent 70%)',
          }}
        />
        <div className="relative">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Stop chasing documents over WhatsApp and email
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            Sign in as staff, reviewer or partner at two separate firms and walk a document from
            upload to approval.
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button size="lg">Try the demo</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
