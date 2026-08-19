import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="rounded-2xl border border-base-border bg-base-raised px-8 py-14 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Stop tracking deadlines in spreadsheets
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">
          Set up your first client in under a minute and see your compliance dashboard populate
          instantly.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <Button size="lg">Create your free account</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
