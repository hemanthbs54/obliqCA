import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TONE_TEXT: Record<string, string> = {
  default: 'text-ink',
  green: 'text-status-green',
  amber: 'text-status-amber',
  orange: 'text-status-orange',
  red: 'text-status-red',
};

export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'green' | 'amber' | 'orange' | 'red';
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-ink-muted">{label}</p>
        <p className={cn('mt-1 text-3xl font-semibold tabular-nums', TONE_TEXT[tone])}>{value}</p>
      </CardContent>
    </Card>
  );
}
