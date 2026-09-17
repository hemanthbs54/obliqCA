'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DOCUMENT_STATUS_META, formatDateTime } from '@obliq/shared';
import { useDocument, useDocumentTimeline, useMe } from '@/hooks/queries';
import { ApiError } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusStepper } from '@/components/documents/StatusStepper';
import { DocumentActions } from '@/components/documents/DocumentActions';
import { VersionList } from '@/components/documents/VersionList';
import { AuditTimeline } from '@/components/audit/AuditTimeline';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: me } = useMe();
  const document = useDocument(id);
  const timeline = useDocumentTimeline(id, document.isSuccess);

  if (document.isLoading || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (document.error) {
    const notFound = document.error instanceof ApiError && document.error.statusCode === 404;
    return (
      <ErrorState
        title={notFound ? 'Document not found' : "Couldn't load this document"}
        message={notFound ? "It doesn't exist, or it belongs to a client you can't access. This attempt was recorded." : document.error.message}
        action={
          <Link href="/dashboard">
            <Button variant="secondary">Back to work queue</Button>
          </Link>
        }
      />
    );
  }
  if (!document.data) return null;
  const doc = document.data;
  const version = doc.current_version;
  const lastDecision = doc.decisions[0];

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href={`/dashboard/clients/${doc.client.id}`} className="hover:text-ink">
            ← {doc.client.name}
          </Link>
        }
        title={doc.name}
        description={DOCUMENT_STATUS_META[doc.status].hint}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-5">
              <StatusStepper status={doc.status} />

              <dl className="grid gap-4 sm:grid-cols-3">
                <Field label="Document">{doc.name}</Field>
                <Field label="Client">{doc.client.name}</Field>
                <Field label="Current status">
                  <StatusBadge status={doc.status} />
                </Field>
                <Field label="Uploaded by">{version?.uploaded_by_profile?.full_name ?? '—'}</Field>
                <Field label="Upload date / time">{version ? formatDateTime(version.uploaded_at) : '—'}</Field>
                <Field label="Reviewer">{doc.reviewer?.full_name ?? '—'}</Field>
              </dl>

              <div>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Review comment</p>
                {doc.last_review_comment ? (
                  <blockquote
                    className={
                      doc.status === 'correction_required'
                        ? 'mt-1 rounded-xl border border-status-red/30 bg-status-red/5 px-4 py-3 text-sm text-ink'
                        : 'mt-1 rounded-xl border border-base-border bg-base px-4 py-3 text-sm text-ink'
                    }
                  >
                    {doc.last_review_comment}
                    {lastDecision && (
                      <footer className="mt-1 text-xs text-ink-muted">
                        {lastDecision.reviewer?.full_name ?? 'Reviewer'} · {formatDateTime(lastDecision.created_at)}
                      </footer>
                    )}
                  </blockquote>
                ) : (
                  <p className="mt-1 text-sm text-ink-muted">No review comments yet.</p>
                )}
              </div>

              <div className="border-t border-base-border pt-5">
                <DocumentActions document={doc} me={me} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <VersionList document={doc} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Audit history</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {timeline.isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
            {timeline.error && <p className="text-sm text-status-red">{timeline.error.message}</p>}
            {timeline.data && <AuditTimeline events={timeline.data} />}
            <p className="mt-5 border-t border-base-border pt-3 text-xs text-ink-faint">
              History is append-only: it can't be edited or deleted by anyone using the app.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
