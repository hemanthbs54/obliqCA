'use client';

import { useRef, useState } from 'react';
import type { DocumentType } from '@obliq/shared';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useUploadDocument } from '@/hooks/useDocuments';
import { useClientTasks } from '@/hooks/useFilings';

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'ledger', label: 'Ledger' },
  { value: 'financial_statement', label: 'Financial statement' },
  { value: 'other', label: 'Other' },
];

export function DocumentUploader({ clientId }: { clientId: string }) {
  const [docType, setDocType] = useState<DocumentType>('invoice');
  const [taskId, setTaskId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument(clientId);
  const { data: tasks } = useClientTasks(clientId);
  const openTasks = (tasks ?? []).filter((t) => t.status !== 'completed');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload.mutateAsync({ file, docType, taskId: taskId || undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-base-border p-4">
      <Select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className="max-w-xs">
        {DOC_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>
      <Select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="max-w-xs">
        <option value="">Link to task (optional)</option>
        {openTasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.period_label}
          </option>
        ))}
      </Select>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.csv,.txt"
        onChange={handleFileChange}
        className="hidden"
        id="document-upload-input"
      />
      <Button
        type="button"
        variant="secondary"
        disabled={upload.isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        {upload.isPending ? 'Uploading…' : 'Upload document'}
      </Button>
      {upload.isError && <p className="text-sm text-status-red">Upload failed. Please try again.</p>}
    </div>
  );
}
