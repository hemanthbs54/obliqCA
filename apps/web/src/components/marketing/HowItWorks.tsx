const STEPS = [
  {
    step: '01',
    title: 'Add a client',
    description:
      'Create a client, request the audit documents you need, such as bank statements, registers and GST returns, and assign staff.',
  },
  {
    step: '02',
    title: 'Staff upload',
    description: 'Assigned staff upload each file. Every upload is kept as a new version.',
  },
  {
    step: '03',
    title: 'Review',
    description: 'A reviewer approves the document or requests a correction with a clear reason.',
  },
  {
    step: '04',
    title: 'Trace every action',
    description: 'See who did what, when and why in a history that can’t be edited.',
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
            From document request to approval in four steps
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
