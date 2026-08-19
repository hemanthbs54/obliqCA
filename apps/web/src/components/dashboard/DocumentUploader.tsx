'use client';

import { useRef, useState } from 'react';
import type { DocumentType } from '@obliq/shared';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useUploadDocument } from '@/hooks/useDocuments';

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'ledger', label: 'Ledger' },
  { value: 'financial_statement', label: 'Financial statement' },
  { value: 'other', label: 'Other' },
];

export function DocumentUploader({ clientId }: { clientId: string }) {
  const [docType, setDocType] = useState<DocumentType>('invoice');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument(clientId);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload.mutateAsync({ file, docType });
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
