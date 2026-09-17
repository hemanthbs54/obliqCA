'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AUDIT_ACTION_META,
  AUDIT_ACTIONS,
  can,
  describeAuditEvent,
  DOCUMENT_STATUS_META,
  formatDateTime,
  ROLE_META,
  shortHash,
  type AuditAction,
} from '@obliq/shared';
import { api, errorMessage } from '@/lib/api';
import { auditQueryString, useAuditEvents, useClients, useMe, useMembers, useVerifyChain, type AuditFilterState } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

export default function AuditLogPage() {
  return (
    <Suspense>
      <AuditLog />
    </Suspense>
  );
}

function ChainStatus() {
  const verify = useVerifyChain();
  if (verify.isLoading) return <Badge>Verifying chain…</Badge>;
  if (verify.error) return <Badge tone="amber">Could not verify</Badge>;
  if (!verify.data) return null;
  return verify.data.ok ? (
    <Badge tone="green" title={`Head hash ${verify.data.headHash}`}>
      ✓ Hash chain verified · {verify.data.events} events
    </Badge>
  ) : (
    <Badge tone="red">✗ Chain broken at event #{verify.data.firstBrokenSeq}</Badge>
  );
}

/** Date inputs give local calendar days; convert to an inclusive UTC range. */
function dayBoundary(day: string, end: boolean): string | undefined {
  if (!day) return undefined;
  const date = new Date(`${day}T${end ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function AuditLog() {
  const toast = useToast();
  const params = useSearchParams();
  const { data: me } = useMe();
  const allowed = me ? can(me.role, 'audit.view_firm_log') : true;

  const [clientId, setClientId] = useState(params.get('clientId') ?? '');
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [fromDay, setFromDay] = useState('');
  const [toDay, setToDay] = useState('');
  const [exporting, setExporting] = useState(false);

  const filters: AuditFilterState = {
    clientId: clientId || undefined,
    actorId: actorId || undefined,
    action: (action || undefined) as AuditAction | undefined,
    from: dayBoundary(fromDay, false),
    to: dayBoundary(toDay, true),
  };

  const clients = useClients();
  const members = useMembers(allowed);
  const events = useAuditEvents(filters);
  const rows = events.data?.pages.flatMap((page) => page.events) ?? [];

  if (me && !allowed) {
    return <ErrorState title="Reviewers only" message="The firm audit log is available to reviewers and partners." />;
  }

  async function exportCsv() {
    setExporting(true);
    try {
      await api.download(`/api/audit-events/export.csv${auditQueryString(filters)}`, 'audit-log.csv');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(clientId || actorId || action || fromDay || toDay);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every action in your firm, newest first. Events are append-only and hash-chained, so any tampering is detectable."
        actions={
          <>
            <ChainStatus />
            <Button variant="secondary" onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-base-border bg-base-raised p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Label htmlFor="filter-client">Client</Label>
          <Select id="filter-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-actor">Person</Label>
          <Select id="filter-actor" value={actorId} onChange={(e) => setActorId(e.target.value)}>
            <option value="">Everyone</option>
            {members.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-action">Action</Label>
          <Select id="filter-action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {AUDIT_ACTION_META[a].label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-from">From</Label>
          <Input id="filter-from" type="date" value={fromDay} onChange={(e) => setFromDay(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="filter-to">To</Label>
          <Input id="filter-to" type="date" value={toDay} onChange={(e) => setToDay(e.target.value)} />
        </div>
      </div>

      {events.isLoading && <TableSkeleton rows={6} />}
      {events.error && <ErrorState title="Couldn't load the audit log" message={events.error.message} />}
      {events.data && rows.length === 0 && (
        <EmptyState title="No events" description={hasFilters ? 'Nothing matches these filters.' : 'Activity will appear here as your team works.'} />
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-base-border">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-base-raised text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">#</th>
                <th scope="col" className="px-4 py-3 font-medium">When</th>
                <th scope="col" className="px-4 py-3 font-medium">Who</th>
                <th scope="col" className="px-4 py-3 font-medium">What happened</th>
                <th scope="col" className="px-4 py-3 font-medium">Status change</th>
                <th scope="col" className="px-4 py-3 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-border">
              {rows.map((event) => (
                <tr key={event.id} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs text-ink-faint">{event.seq}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatDateTime(event.occurred_at)}</td>
                  <td className="px-4 py-3">
                    <span className="text-ink">{event.actor_name}</span>
                    {event.actor_role && <span className="block text-xs text-ink-muted">{ROLE_META[event.actor_role].label}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={AUDIT_ACTION_META[event.action].tone}>{AUDIT_ACTION_META[event.action].label}</Badge>
                    <p className="mt-1 text-ink">
                      {event.document_id && event.action !== 'access.denied' ? (
                        <Link href={`/dashboard/documents/${event.document_id}`} className="hover:text-accent">
                          {describeAuditEvent(event)}
                        </Link>
                      ) : (
                        describeAuditEvent(event)
                      )}
                    </p>
                    {event.client_name && event.action !== 'client.created' && <p className="text-xs text-ink-muted">{event.client_name}</p>}
                    {event.comment && <p className="mt-1 max-w-md rounded-lg bg-base px-2 py-1 text-xs text-ink-muted">“{event.comment}”</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                    {event.to_status
                      ? `${event.from_status ? DOCUMENT_STATUS_META[event.from_status].label : '—'} → ${DOCUMENT_STATUS_META[event.to_status].label}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-faint" title={`hash ${event.hash}\nprev ${event.prev_hash}`}>
                    {shortHash(event.hash, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {events.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => events.fetchNextPage()} disabled={events.isFetchingNextPage}>
            {events.isFetchingNextPage ? 'Loading…' : 'Load older events'}
          </Button>
        </div>
      )}
    </>
  );
}
