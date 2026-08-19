'use client';

import { useState } from 'react';
import { titleCase, type DocumentRecord } from '@obliq/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDeleteDocument } from '@/hooks/useDocuments';

const STATUS_TONE: Record<DocumentRecord['status'], 'default' | 'amber' | 'green' | 'red'> = {
  uploaded: 'default',
  processing: 'amber',
  processed: 'green',
  failed: 'red',
};

export function DocumentList({ clientId, documents }: { clientId: string; documents: DocumentRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const deleteDocument = useDeleteDocument(clientId);

  if (documents.length === 0) {
    return <p className="text-sm text-ink-muted">No documents uploaded yet.</p>;
  }

  return (
    <div className="divide-y divide-base-border rounded-2xl border border-base-border">
      {documents.map((doc) => (
        <div key={doc.id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="flex-1 text-left"
              onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
            >
              <p className="text-sm font-medium text-ink">{doc.file_name}</p>
              <p className="text-xs text-ink-muted">{titleCase(doc.doc_type)}</p>
            </button>
            <div className="flex items-center gap-3">
              <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
              <Button variant="ghost" size="sm" onClick={() => deleteDocument.mutate(doc.id)}>
                Delete
              </Button>
            </div>
          </div>

          {expandedId === doc.id && (
            <div className="mt-3 rounded-xl bg-base px-3 py-3 text-sm">
              {doc.status === 'failed' && (
                <p className="text-status-red">{doc.error_message ?? 'Processing failed.'}</p>
              )}
              {doc.status === 'processed' && doc.extracted_summary?.fields?.length ? (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {doc.extracted_summary.fields.map((f) => (
                    <div key={f.field} className="flex justify-between gap-3">
                      <dt className="text-ink-muted">{titleCase(f.field)}</dt>
                      <dd className="text-ink">{f.value ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              ) : doc.status === 'processed' ? (
                <p className="text-ink-muted">No fields extracted from this document.</p>
              ) : (
                <p className="text-ink-muted">Processing…</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
