const STEPS = [
  {
    step: '01',
    title: 'Add a client',
    description: 'Create a client and attach the filings that apply to them — GST, TDS, ITR.',
  },
  {
    step: '02',
    title: 'Upload documents',
    description:
      'Drop in invoices, ledgers, or statements. Obliq extracts key figures automatically.',
  },
  {
    step: '03',
    title: 'Run the compliance check',
    description:
      'The agent evaluates deadlines and documents, flags what’s missing or overdue, and writes a summary.',
  },
  {
    step: '04',
    title: 'Act from one dashboard',
    description: 'See every client’s status at a glance and drill into the ones that need you.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-base-border/60 bg-base-raised/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">How it works</h2>
          <p className="mt-3 text-ink-muted">From client to compliance status in four steps.</p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => (
            <div key={item.step}>
              <div className="text-sm font-mono text-accent">{item.step}</div>
              <h3 className="mt-2 text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
