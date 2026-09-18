'use client';

import { useState, type FormEvent } from 'react';
import { DEFAULT_REQUIRED_DOCUMENTS, type ClientDetail } from '@obliq/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useAddDocument, useAssignStaff, useCreateClient, useMembers } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';

export function CreateClientDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (client: ClientDetail) => void }) {
  const toast = useToast();
  const createClient = useCreateClient();
  const [name, setName] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [documents, setDocuments] = useState<string[]>([...DEFAULT_REQUIRED_DOCUMENTS]);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  function toggle(doc: string) {
    setDocuments((current) => (current.includes(doc) ? current.filter((d) => d !== doc) : [...current, doc]));
  }

  function addCustom() {
    const value = custom.trim();
    if (value.length >= 2 && !documents.includes(value)) setDocuments((current) => [...current, value]);
    setCustom('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createClient.mutate(
      { name, pan: pan || null, gstin: gstin || null, documentNames: documents },
      {
        onSuccess: (client) => {
          toast(`${client.name} created`, 'success');
          onCreated(client);
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  const options = [...new Set([...DEFAULT_REQUIRED_DOCUMENTS, ...documents])];

  return (
    <Modal open={open} onClose={onClose} title="New client" description="Pick the audit documents you need from this client. You can add more later.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="client-name">Client name</Label>
          <Input id="client-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Traders Pvt. Ltd." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="client-pan">PAN (optional)</Label>
            <Input id="client-pan" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="AABCA1234C" maxLength={10} />
          </div>
          <div>
            <Label htmlFor="client-gstin">GSTIN (optional)</Label>
            <Input id="client-gstin" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="27AABCA1234C1Z5" maxLength={15} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-muted">Required documents</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((doc) => (
              <label key={doc} className="flex items-center gap-2 rounded-lg border border-base-border px-3 py-2 text-sm text-ink">
                <input type="checkbox" checked={documents.includes(doc)} onChange={() => toggle(doc)} className="accent-[hsl(var(--color-accent))]" />
                {doc}
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              aria-label="Add another document"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Add another, e.g. Fixed Asset Register"
            />
            <Button type="button" variant="secondary" onClick={addCustom}>
              Add
            </Button>
          </div>
        </fieldset>
        {error && <p className="text-sm text-status-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} data-close>
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

export function AssignStaffDialog({ client, open, onClose }: { client: ClientDetail; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const members = useMembers(open);
  const assign = useAssignStaff(client.id);
  const [userId, setUserId] = useState('');
  const assignedIds = new Set(client.assigned_staff.map((s) => s.id));
  const available = (members.data ?? []).filter((m) => m.role === 'staff' && !assignedIds.has(m.id));

  return (
    <Modal open={open} onClose={onClose} title="Assign staff" description={`Assigned staff can see ${client.name} and upload its documents. Other staff can't see this client at all.`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!userId) return;
          assign.mutate(userId, {
            onSuccess: () => {
              toast('Staff assigned', 'success');
              onClose();
            },
            onError: (err) => toast(errorMessage(err), 'error'),
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="assign-staff">Staff member</Label>
          <Select id="assign-staff" value={userId} onChange={(e) => setUserId(e.target.value)} disabled={members.isLoading}>
            <option value="">{members.isLoading ? 'Loading…' : available.length ? 'Choose a staff member' : 'Everyone is already assigned'}</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.email})
              </option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} data-close>
            Cancel
          </Button>
          <Button type="submit" disabled={!userId || assign.isPending}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AddDocumentDialog({ clientId, open, onClose }: { clientId: string; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const addDocument = useAddDocument(clientId);
  const [name, setName] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Request another document">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addDocument.mutate(name, {
            onSuccess: () => {
              toast(`${name.trim()} added`, 'success');
              onClose();
            },
            onError: (err) => toast(errorMessage(err), 'error'),
          });
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="document-name">Document name</Label>
          <Input id="document-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Fixed Asset Register" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} data-close>
            Cancel
          </Button>
          <Button type="submit" disabled={addDocument.isPending}>
            Add document
          </Button>
        </div>
      </form>
    </Modal>
  );
}
