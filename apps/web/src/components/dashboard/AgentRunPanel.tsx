'use client';

import { formatDate } from '@obliq/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgentRuns, useRunComplianceAgent } from '@/hooks/useAgent';

const SEVERITY_TONE: Record<string, 'red' | 'amber' | 'default'> = {
  critical: 'red',
  warning: 'amber',
  info: 'default',
};

export function AgentRunPanel({ clientId }: { clientId: string }) {
  const runAgent = useRunComplianceAgent(clientId);
  const { data: runs } = useAgentRuns(clientId);

  const lastComplianceRun = runs?.find((r) => r.run_type === 'compliance_check' && r.status === 'completed');
  const lastOutput = lastComplianceRun?.output as
    | { evaluation: { flags: { message: string; severity: string }[] }; narrative: string }
    | undefined;

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-ink-muted">Compliance agent</h2>
            {lastComplianceRun && (
              <p className="mt-0.5 text-xs text-ink-faint">
                Last checked {formatDate(lastComplianceRun.started_at)}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => runAgent.mutate()} disabled={runAgent.isPending}>
            {runAgent.isPending ? 'Running…' : 'Run compliance check'}
          </Button>
        </div>

        {runAgent.data && (
          <p className="mt-4 text-sm text-ink">{runAgent.data.narrative}</p>
        )}
        {!runAgent.data && lastOutput && <p className="mt-4 text-sm text-ink">{lastOutput.narrative}</p>}

        {(runAgent.data?.flags ?? lastOutput?.evaluation.flags ?? []).length > 0 && (
          <ul className="mt-4 space-y-2">
            {(runAgent.data?.flags ?? lastOutput?.evaluation.flags ?? []).map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge tone={SEVERITY_TONE[flag.severity] ?? 'default'} className="mt-0.5 shrink-0">
                  {flag.severity}
                </Badge>
                <span className="text-ink-muted">{flag.message}</span>
              </li>
            ))}
          </ul>
        )}

        {!runAgent.data && !lastComplianceRun && (
          <p className="mt-4 text-sm text-ink-muted">
            Run a compliance check to evaluate this client&apos;s filings and documents.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
