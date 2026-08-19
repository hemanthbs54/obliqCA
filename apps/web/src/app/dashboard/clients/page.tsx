'use client';

import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { ClientTable } from '@/components/dashboard/ClientTable';
import { CreateClientModal } from '@/components/dashboard/CreateClientModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { data: clients, isLoading } = useClients({ search: search || undefined });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Clients</h1>
          <p className="mt-1 text-sm text-ink-muted">Every client you track compliance for.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Add client</Button>
      </div>

      <div className="mt-6 max-w-sm">
        <Input placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading clients…</p>
        ) : (
          <ClientTable clients={clients ?? []} />
        )}
      </div>

      <CreateClientModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
