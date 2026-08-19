import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="hsl(var(--color-base))" />
        <path
          d="M16 6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
          fill="hsl(var(--color-accent))"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-ink">Obliq</span>
    </div>
  );
}
