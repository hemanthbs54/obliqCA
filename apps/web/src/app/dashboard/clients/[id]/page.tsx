'use client';

import { useParams } from 'next/navigation';
import { titleCase } from '@obliq/shared';
import { useClient } from '@/hooks/useClient';
import { useClientFilings, useClientTasks } from '@/hooks/useFilings';
import { Card, CardContent } from '@/components/ui/Card';
import { TaskList } from '@/components/dashboard/TaskList';
import { AgentRunPanel } from '@/components/dashboard/AgentRunPanel';

export default function ClientOverviewPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const { data: client } = useClient(clientId);
  const { data: filings } = useClientFilings(clientId);
  const { data: tasks } = useClientTasks(clientId);

  const activeFilings = (filings ?? []).filter((f) => f.is_active);
  const upcomingTasks = (tasks ?? []).filter((t) => t.status !== 'completed').slice(0, 5);

  return (
    <div className="space-y-8">
      <AgentRunPanel clientId={clientId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-medium text-ink-muted">Client details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Type</dt>
                <dd className="text-ink">{client ? titleCase(client.client_type) : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">GSTIN</dt>
                <dd className="text-ink">{client?.gstin || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">PAN</dt>
                <dd className="text-ink">{client?.pan || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Email</dt>
                <dd className="text-ink">{client?.email || '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-medium text-ink-muted">Filings tracked</h2>
            <p className="mt-3 text-3xl font-semibold text-ink">{activeFilings.length}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {activeFilings.length === 0
                ? 'Attach a filing to start tracking deadlines.'
                : activeFilings.map((f) => f.filing_type.name).join(', ')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink">Upcoming tasks</h2>
        <div className="mt-3">
          <TaskList clientId={clientId} tasks={upcomingTasks} />
        </div>
      </div>
    </div>
  );
}
