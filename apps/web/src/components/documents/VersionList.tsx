'use client';

import { useState } from 'react';
import { formatBytes, formatDateTime, shortHash, type DocumentDetail } from '@obliq/shared';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { getVersionUrl } from '@/hooks/queries';
import { errorMessage } from '@/lib/api';

export function VersionList({ document }: { document: DocumentDetail }) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function open(versionId: string, download: boolean) {
    setBusy(versionId + download);
    // Open the tab synchronously so pop-up blockers allow it, then point it at the short-lived signed URL.
    const tab = download ? null : window.open('', '_blank');
    try {
      const { url } = await getVersionUrl(document.id, versionId, download);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (error) {
      tab?.close();
      toast(errorMessage(error), 'error');
    } finally {
      setBusy(null);
    }
  }

  if (document.versions.length === 0) {
    return <p className="text-sm text-ink-muted">No file uploaded yet.</p>;
  }

  const decisionByVersion = new Map(document.decisions.map((d) => [d.version_id, d]));

  return (
    <ul className="divide-y divide-base-border">
      {document.versions.map((version) => {
        const decision = decisionByVersion.get(version.id);
        const isCurrent = version.id === document.current_version_id;
        return (
          <li key={version.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">v{version.version_no}</span>
                <span className="truncate text-sm text-ink">{version.file_name}</span>
                {isCurrent && <Badge tone="accent">Current</Badge>}
                {decision && (
                  <Badge tone={decision.decision === 'approved' ? 'green' : 'red'}>
                    {decision.decision === 'approved' ? 'Approved' : 'Correction requested'}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {version.uploaded_by_profile?.full_name ?? 'Unknown'} · {formatDateTime(version.uploaded_at)} ·{' '}
                {formatBytes(version.size_bytes)} ·{' '}
                <span title={`SHA-256 ${version.sha256}`} className="font-mono">
                  sha256 {shortHash(version.sha256)}
                </span>
              </p>
              {version.response_note && <p className="mt-1 text-xs text-ink-muted">Note: {version.response_note}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="secondary" onClick={() => open(version.id, false)} disabled={busy !== null}>
                View
              </Button>
              <Button size="sm" variant="ghost" onClick={() => open(version.id, true)} disabled={busy !== null}>
                Download
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
