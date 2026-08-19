'use client';

import Link from 'next/link';
import { formatDate } from '@obliq/shared';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useClients } from '@/hooks/useClients';
import { StatCard } from '@/components/dashboard/StatCard';
import { ClientTable } from '@/components/dashboard/ClientTable';
import { Card, CardContent } from '@/components/ui/Card';

export default function DashboardOverviewPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: clients, isLoading: clientsLoading } = useClients();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Overview</h1>
      <p className="mt-1 text-sm text-ink-muted">Your firm&apos;s compliance status at a glance.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total clients" value={summary?.totalClients ?? 0} />
        <StatCard label="On track" value={summary?.statusCounts.on_track ?? 0} tone="green" />
        <StatCard label="Due soon" value={summary?.statusCounts.due_soon ?? 0} tone="amber" />
        <StatCard label="Overdue" value={summary?.statusCounts.overdue ?? 0} tone="red" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-ink">Clients</h2>
          <div className="mt-3">
            {clientsLoading ? (
              <p className="text-sm text-ink-muted">Loading…</p>
            ) : (
              <ClientTable clients={clients ?? []} />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Upcoming deadlines</h2>
          <Card className="mt-3">
            <CardContent className="pt-5">
              {summaryLoading ? (
                <p className="text-sm text-ink-muted">Loading…</p>
              ) : summary?.upcomingDeadlines.length ? (
                <ul className="space-y-3">
                  {summary.upcomingDeadlines.map((d, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <Link
                        href={`/dashboard/clients/${d.clientId}`}
                        className="text-ink hover:text-accent"
                      >
                        {d.clientName}
                      </Link>
                      <span className="text-ink-muted">
                        {d.filingType} · {formatDate(d.dueDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">Nothing due in the next 7 days.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
