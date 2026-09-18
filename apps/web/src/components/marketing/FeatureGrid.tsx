import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';
import { IconBot, IconCalendar, IconFileSearch, IconGauge, IconMessage, IconPlug } from './icons';

const FEATURES = [
  {
    icon: IconFileSearch,
    title: 'Versioned document review',
    description:
      'Every upload is kept as a new version with who uploaded it, when, and its SHA-256 fingerprint, so you always know which file was approved.',
  },
  {
    icon: IconMessage,
    title: 'Corrections with a reason',
    description:
      'Reviewers can’t send a document back without explaining why. Staff see the exact reason and upload a corrected version.',
  },
  {
    icon: IconCalendar,
    title: 'Tamper-evident audit trail',
    description:
      'Who did what, when, and why: every action is recorded in an append-only, hash-chained history that nobody can edit or delete.',
  },
  {
    icon: IconBot,
    title: 'Maker-checker built in',
    description:
      'Whoever uploaded a file can never approve it, even a partner. Separation of duties is enforced by the database.',
  },
  {
    icon: IconGauge,
    title: 'Role-aware work queue',
    description:
      'Staff see what to upload or correct; reviewers see what’s waiting for a decision, sorted by what needs attention first.',
  },
  {
    icon: IconPlug,
    title: 'Firm isolation by design',
    description:
      'Each firm’s clients and documents are separated in the database itself, not just hidden in the UI. Another firm’s data simply doesn’t exist for you.',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">Features</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Everything your audit review workflow needs
        </h2>
        <p className="mt-3 text-ink-muted">
          One place for every client document: from the first upload to the final approval, with
          every step traceable.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card
            key={feature.title}
            className="group transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
          >
            <CardContent className="pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-muted text-accent transition-colors group-hover:bg-accent group-hover:text-accent-ink">
                <feature.icon width={22} height={22} />
              </div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
