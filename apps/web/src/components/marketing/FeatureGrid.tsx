import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';
import { IconBot, IconCalendar, IconFileSearch, IconGauge, IconMessage, IconPlug } from './icons';

const FEATURES = [
  {
    icon: IconCalendar,
    title: 'Per-client filing calendar',
    description:
      'Attach GST, TDS, or ITR filing types to each client and Obliq generates the task checklist and due dates automatically.',
  },
  {
    icon: IconFileSearch,
    title: 'Document intelligence',
    description:
      'Upload invoices, ledgers, and financial statements — Obliq chunks, embeds, and extracts the figures that matter (taxable amount, GST liability, GSTIN, dates).',
  },
  {
    icon: IconBot,
    title: 'AI compliance agent',
    description:
      'A rules-based agent evaluates every client against real deadlines and documents, then writes a plain-English summary of what needs attention.',
  },
  {
    icon: IconMessage,
    title: 'Ask your documents',
    description:
      'Chat with a client’s uploaded documents directly — "What was the taxable value on the March invoice?" — with answers grounded in the source text.',
  },
  {
    icon: IconGauge,
    title: 'Traffic-light dashboard',
    description:
      'See every client at a glance: on track, due soon, overdue, or missing documents — sorted by what needs you first.',
  },
  {
    icon: IconPlug,
    title: 'Bring your own AI',
    description:
      'Works fully offline in demo mode out of the box. Flip a single setting to connect Gemini, Groq, or OpenAI when you’re ready to go live.',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent">Features</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Everything your compliance workflow needs
        </h2>
        <p className="mt-3 text-ink-muted">
          One dashboard for every client, every filing, and every document — with an agent
          watching the deadlines so you don&apos;t have to.
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
