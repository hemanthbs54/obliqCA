import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'h-10 w-full rounded-xl border border-base-border bg-base px-3 text-sm text-ink',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50',
          className,
        )}
        {...props}
      />
    );
  },
);
Select.displayName = 'Select';
