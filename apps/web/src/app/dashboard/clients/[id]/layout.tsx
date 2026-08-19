'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useClient } from '@/hooks/useClient';
import { ComplianceStatusBadge } from '@/components/dashboard/ComplianceStatusBadge';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '', label: 'Overview' },
  { href: '/filings', label: 'Filings' },
  { href: '/documents', label: 'Documents' },
  { href: '/chat', label: 'Chat' },
];

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { data: client } = useClient(params.id);
  const base = `/dashboard/clients/${params.id}`;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink">{client?.name ?? 'Client'}</h1>
        {client && <ComplianceStatusBadge status={client.compliance_status} />}
      </div>

      <div className="mt-4 flex gap-1 border-b border-base-border">
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium',
                active
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
