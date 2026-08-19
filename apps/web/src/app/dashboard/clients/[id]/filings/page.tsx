'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { titleCase } from '@obliq/shared';
import { useAttachFiling, useClientFilings, useClientTasks, useFilingTypes } from '@/hooks/useFilings';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TaskList } from '@/components/dashboard/TaskList';

export default function ClientFilingsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const { data: filingTypes } = useFilingTypes();
  const { data: clientFilings } = useClientFilings(clientId);
  const { data: tasks } = useClientTasks(clientId);
  const attachFiling = useAttachFiling(clientId);
  const [selectedFilingTypeId, setSelectedFilingTypeId] = useState('');

  const attachedIds = new Set((clientFilings ?? []).filter((f) => f.is_active).map((f) => f.filing_type_id));
  const availableFilingTypes = (filingTypes ?? []).filter((ft) => !attachedIds.has(ft.id));

  async function handleAttach() {
    if (!selectedFilingTypeId) return;
    await attachFiling.mutateAsync({ filingTypeId: selectedFilingTypeId });
    setSelectedFilingTypeId('');
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-5">
          <h2 className="text-base font-semibold text-ink">Attach a filing</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Attaching a filing type generates its first task automatically.
          </p>
          <div className="mt-4 flex gap-3">
            <Select
              value={selectedFilingTypeId}
              onChange={(e) => setSelectedFilingTypeId(e.target.value)}
              className="max-w-xs"
            >
              <option value="">Select a filing type…</option>
              {availableFilingTypes.map((ft) => (
                <option key={ft.id} value={ft.id}>
                  {ft.name} ({titleCase(ft.frequency)})
                </option>
              ))}
            </Select>
            <Button onClick={handleAttach} disabled={!selectedFilingTypeId || attachFiling.isPending}>
              {attachFiling.isPending ? 'Attaching…' : 'Attach'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold text-ink">Attached filings</h2>
        <div className="mt-3 space-y-2">
          {(clientFilings ?? []).filter((f) => f.is_active).length === 0 && (
            <p className="text-sm text-ink-muted">No filings attached yet.</p>
          )}
          {(clientFilings ?? [])
            .filter((f) => f.is_active)
            .map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-base-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{f.filing_type.name}</p>
                  <p className="text-xs text-ink-muted">
                    {titleCase(f.frequency_override ?? f.filing_type.frequency)} · {f.filing_type.category}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink">Tasks</h2>
        <div className="mt-3">
          <TaskList clientId={clientId} tasks={tasks ?? []} />
        </div>
      </div>
    </div>
  );
}
