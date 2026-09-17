'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { can } from '@obliq/shared';
import { useClients, useMe } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { ClientProgress } from '@/components/clients/ClientProgress';
import { CreateClientDialog } from '@/components/clients/ClientDialogs';

export default function ClientsPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const clients = useClients();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const canCreate = me ? can(me.role, 'client.create') : false;

  const filtered = (clients.data ?? []).filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <>
      <PageHeader
        title="Clients"
        description={me?.role === 'staff' ? 'Clients you are assigned to.' : `All clients of ${me?.firm.name ?? 'your firm'}.`}
        actions={canCreate && <Button onClick={() => setCreating(true)}>New client</Button>}
      />

      <div className="mb-4 max-w-sm">
        <Input aria-label="Search clients" placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {clients.isLoading && <TableSkeleton rows={3} />}
      {clients.error && <ErrorState title="Couldn't load clients" message={clients.error.message} />}
      {clients.data && filtered.length === 0 && (
        <EmptyState
          title={search ? 'No clients match your search' : 'No clients yet'}
          description={me?.role === 'staff' && !search ? 'A reviewer or partner needs to assign you to a client.' : undefined}
        />
      )}

      {filtered.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((client) => (
            <li key={client.id}>
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="block rounded-2xl border border-base-border bg-base-raised p-5 transition-colors hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{client.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {[client.pan && `PAN ${client.pan}`, client.gstin && `GSTIN ${client.gstin}`].filter(Boolean).join(' · ') || 'No tax IDs recorded'}
                    </p>
                  </div>
                  <ClientProgress counts={client.document_counts} total={client.total_documents} />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  <span>{client.document_counts.uploaded + client.document_counts.under_review} awaiting review</span>
                  <span>{client.document_counts.pending} not uploaded</span>
                  <span>Staff: {client.assigned_staff.map((s) => s.full_name).join(', ') || 'unassigned'}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <CreateClientDialog open onClose={() => setCreating(false)} onCreated={(client) => router.push(`/dashboard/clients/${client.id}`)} />
      )}
    </>
  );
}
