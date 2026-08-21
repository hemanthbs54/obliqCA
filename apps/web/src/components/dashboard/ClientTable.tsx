'use client';

import Link from 'next/link';
import { COMPLIANCE_STATUS_PRECEDENCE, formatDate, titleCase, type ClientWithStatus } from '@obliq/shared';
import { ComplianceStatusBadge } from './ComplianceStatusBadge';

export function ClientTable({ clients }: { clients: ClientWithStatus[] }) {
  const sorted = [...clients].sort(
    (a, b) =>
      COMPLIANCE_STATUS_PRECEDENCE.indexOf(a.compliance_status) -
      COMPLIANCE_STATUS_PRECEDENCE.indexOf(b.compliance_status),
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-base-border py-16 text-center text-sm text-ink-muted">
        No clients yet. Add your first client to get started.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-base-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-base-raised/60 text-left text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Next due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-border">
            {sorted.map((client) => (
              <tr key={client.id} className="hover:bg-base-raised/40">
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                  {titleCase(client.client_type)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <ComplianceStatusBadge status={client.compliance_status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                  {client.next_due_date
                    ? `${formatDate(client.next_due_date)}${client.next_due_filing_type ? ` · ${client.next_due_filing_type}` : ''}`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
