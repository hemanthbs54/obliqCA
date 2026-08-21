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
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            From client to compliance status in four steps
          </h2>
        </div>
        <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute inset-x-0 top-5 hidden h-px bg-base-border lg:block" />
          {STEPS.map((item) => (
            <div key={item.step} className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-base text-sm font-semibold text-accent">
                {item.step}
              </div>
              <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
