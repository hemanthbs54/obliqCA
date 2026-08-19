import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';

const FEATURES = [
  {
    title: 'Per-client filing calendar',
    description:
      'Attach GST, TDS, or ITR filing types to each client and Obliq generates the task checklist and due dates automatically.',
  },
  {
    title: 'Document intelligence',
    description:
      'Upload invoices, ledgers, and financial statements — Obliq chunks, embeds, and extracts the figures that matter (taxable amount, GST liability, GSTIN, dates).',
  },
  {
    title: 'AI compliance agent',
    description:
      'A rules-based agent evaluates every client against real deadlines and documents, then writes a plain-English summary of what needs attention.',
  },
  {
    title: 'Ask your documents',
    description:
      'Chat with a client’s uploaded documents directly — "What was the taxable value on the March invoice?" — with answers grounded in the source text.',
  },
  {
    title: 'Traffic-light dashboard',
    description:
      'See every client at a glance: on track, due soon, overdue, or missing documents — sorted by what needs you first.',
  },
  {
    title: 'Bring your own AI',
    description:
      'Works fully offline in demo mode out of the box. Flip a single setting to connect Gemini, Groq, or OpenAI when you’re ready to go live.',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink">
          Everything your compliance workflow needs
        </h2>
        <p className="mt-3 text-ink-muted">
          One dashboard for every client, every filing, and every document — with an agent
          watching the deadlines so you don&apos;t have to.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="pt-5">
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
