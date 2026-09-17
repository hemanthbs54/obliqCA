'use client';

import Link from 'next/link';
import { ROLE_META } from '@obliq/shared';
import { useMe, useQueue } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { DocumentTable } from '@/components/documents/DocumentTable';
import { Button } from '@/components/ui/Button';

const COPY = {
  staff: {
    description: 'Documents waiting on you: corrections first, then files not uploaded yet.',
    empty: 'Nothing to upload right now. Every document on your clients is uploaded or approved.',
  },
  reviewer: {
    description: 'Documents waiting on a review decision: your open reviews first, then new uploads.',
    empty: 'No documents are waiting for review.',
  },
  partner: {
    description: 'Every document in the firm that is waiting on a review decision.',
    empty: 'No documents are waiting for review.',
  },
} as const;

export default function WorkQueuePage() {
  const { data: me } = useMe();
  const queue = useQueue();
  const copy = me ? COPY[me.role] : null;

  return (
    <>
      <PageHeader
        eyebrow={me ? `Signed in as ${ROLE_META[me.role].label.toLowerCase()} · ${me.firm.name}` : undefined}
        title={me ? `Hi ${me.user.full_name.split(' ')[0]}, here's your work queue` : 'Work queue'}
        description={copy?.description}
        actions={
          <Link href="/dashboard/clients">
            <Button variant="secondary">All clients</Button>
          </Link>
        }
      />

      {queue.isLoading && <TableSkeleton rows={4} />}
      {queue.error && <ErrorState title="Couldn't load your queue" message={queue.error.message} />}
      {queue.data &&
        (queue.data.items.length === 0 ? (
          <EmptyState title="You're all caught up" description={copy?.empty} />
        ) : (
          <DocumentTable documents={queue.data.items} showClient />
        ))}
    </>
  );
}
