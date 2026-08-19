'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCreateClient } from '@/hooks/useClients';

const CLIENT_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'company', label: 'Company' },
];

export function CreateClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const createClient = useCreateClient();
  const [name, setName] = useState('');
  const [clientType, setClientType] = useState('individual');
  const [gstin, setGstin] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const client = await createClient.mutateAsync({ name, clientType, gstin: gstin || undefined });
    setName('');
    setGstin('');
    onClose();
    router.push(`/dashboard/clients/${client.id}`);
  }

  return (
    <Modal open={open} onClose={onClose} title="Add client">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="clientName">Client name</Label>
          <Input id="clientName" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="clientType">Type</Label>
          <Select id="clientType" value={clientType} onChange={(e) => setClientType(e.target.value)}>
            {CLIENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="gstin">GSTIN (optional)</Label>
          <Input id="gstin" value={gstin} onChange={(e) => setGstin(e.target.value)} />
        </div>
        {createClient.isError && (
          <p className="text-sm text-status-red">Could not create client. Please try again.</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createClient.isPending}>
            {createClient.isPending ? 'Creating…' : 'Create client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
