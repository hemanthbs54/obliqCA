'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { can, type AuditEventPage } from '@obliq/shared';
import { api, ApiError } from '@/lib/api';
import { useClient, useMe } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { DocumentTable } from '@/components/documents/DocumentTable';
import { ClientProgress } from '@/components/clients/ClientProgress';
import { AddDocumentDialog, AssignStaffDialog } from '@/components/clients/ClientDialogs';
import { AuditTimeline } from '@/components/audit/AuditTimeline';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const client = useClient(id);
  const [dialog, setDialog] = useState<'assign' | 'add' | null>(null);
  const canManage = me ? can(me.role, 'client.assign_staff') : false;

  const activity = useQuery({
    queryKey: ['audit', { clientId: id, recent: true }],
    queryFn: () => api.get<AuditEventPage>(`/api/audit-events?clientId=${id}&limit=15`),
    enabled: canManage,
  });

  if (client.isLoading) return <TableSkeleton rows={5} />;
  if (client.error) {
    const notFound = client.error instanceof ApiError && client.error.statusCode === 404;
    return (
      <ErrorState
        title={notFound ? 'Client not found' : "Couldn't load this client"}
        message={notFound ? "It doesn't exist, or you don't have access to it." : client.error.message}
        action={
          <Link href="/dashboard/clients">
            <Button variant="secondary">Back to clients</Button>
          </Link>
        }
      />
    );
  }
  if (!client.data) return null;
  const data = client.data;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/dashboard/clients" className="hover:text-ink">
            ← Clients
          </Link>
        }
        title={data.name}
        description={[data.pan && `PAN ${data.pan}`, data.gstin && `GSTIN ${data.gstin}`].filter(Boolean).join(' · ') || undefined}
        actions={
          canManage && (
            <>
              <Button variant="secondary" onClick={() => setDialog('assign')}>
                Assign staff
              </Button>
              <Button onClick={() => setDialog('add')}>Request document</Button>
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="documents-heading" className="min-w-0">
          <h2 id="documents-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Required audit documents
          </h2>
          {data.documents.length === 0 ? (
            <EmptyState title="No documents requested yet" />
          ) : (
            <DocumentTable documents={data.documents} />
          )}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ClientProgress counts={data.document_counts} total={data.total_documents} />
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Assigned staff</p>
                <p className="mt-1 text-sm text-ink">{data.assigned_staff.map((s) => s.full_name).join(', ') || 'Nobody yet'}</p>
              </div>
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Recent activity</CardTitle>
                <Link href={`/dashboard/audit?clientId=${data.id}`} className="text-xs text-accent hover:underline">
                  Full log
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                {activity.data ? <AuditTimeline events={activity.data.events} /> : <p className="text-sm text-ink-muted">Loading…</p>}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {dialog === 'assign' && <AssignStaffDialog client={data} open onClose={() => setDialog(null)} />}
      {dialog === 'add' && <AddDocumentDialog clientId={data.id} open onClose={() => setDialog(null)} />}
    </>
  );
}
