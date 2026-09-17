import Link from 'next/link';
import { formatDateTime, type DocumentListItem } from '@obliq/shared';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function DocumentTable({ documents, showClient }: { documents: (DocumentListItem & { client?: { name: string } })[]; showClient?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-base-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-base-raised text-xs uppercase tracking-wide text-ink-faint">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Document</th>
            {showClient && <th scope="col" className="px-4 py-3 font-medium">Client</th>}
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Latest file</th>
            <th scope="col" className="px-4 py-3 font-medium">Uploaded by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-base-border">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-base-raised/60">
              <td className="px-4 py-3">
                <Link href={`/dashboard/documents/${doc.id}`} className="font-medium text-ink hover:text-accent">
                  {doc.name}
                </Link>
                {doc.status === 'correction_required' && doc.last_review_comment && (
                  <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-status-red">{doc.last_review_comment}</p>
                )}
              </td>
              {showClient && <td className="px-4 py-3 text-ink-muted">{doc.client?.name}</td>}
              <td className="px-4 py-3">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {doc.current_version ? (
                  <span>
                    <span className="text-ink">{doc.current_version.file_name}</span>
                    <span className="ml-1 text-xs">v{doc.current_version.version_no}</span>
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {doc.current_version ? (
                  <>
                    <span className="text-ink">{doc.current_version.uploaded_by_profile?.full_name ?? 'Unknown'}</span>
                    <span className="block text-xs">{formatDateTime(doc.current_version.uploaded_at)}</span>
                  </>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
