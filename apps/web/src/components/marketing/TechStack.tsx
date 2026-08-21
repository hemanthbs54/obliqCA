const STACK = [
  'Next.js',
  'TypeScript',
  'Tailwind CSS',
  'Fastify',
  'Supabase',
  'Postgres + pgvector',
  'Docker',
  'GitHub Actions',
  'Vercel',
  'Render',
  'Gemini',
];

export function TechStack() {
  return (
    <section className="border-y border-base-border/60 bg-base-raised/20 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-ink-faint">
          Built on
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {STACK.map((tech) => (
            <span key={tech} className="text-sm font-medium text-ink-muted">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
