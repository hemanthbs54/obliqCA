'use client';

import { useParams } from 'next/navigation';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentUploader } from '@/components/dashboard/DocumentUploader';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { TableSkeleton } from '@/components/ui/Skeleton';

export default function ClientDocumentsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const { data: documents, isLoading } = useDocuments(clientId);

  return (
    <div className="space-y-6">
      <DocumentUploader clientId={clientId} />
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : (
        <DocumentList clientId={clientId} documents={documents ?? []} />
      )}
    </div>
  );
}
