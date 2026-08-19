import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'accent' | 'green' | 'amber' | 'orange' | 'red';

const toneClasses: Record<Tone, string> = {
  default: 'bg-base-border/40 text-ink-muted',
  accent: 'bg-accent-muted text-accent',
  green: 'bg-status-green/15 text-status-green',
  amber: 'bg-status-amber/15 text-status-amber',
  orange: 'bg-status-orange/15 text-status-orange',
  red: 'bg-status-red/15 text-status-red',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
