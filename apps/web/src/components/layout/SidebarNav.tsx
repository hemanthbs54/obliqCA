'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { can } from '@obliq/shared';
import { useMe } from '@/hooks/queries';
import { cn } from '@/lib/utils';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: me } = useMe();

  const items = [
    { href: '/dashboard', label: 'Work queue', show: true },
    { href: '/dashboard/clients', label: 'Clients', show: true },
    { href: '/dashboard/audit', label: 'Audit log', show: me ? can(me.role, 'audit.view_firm_log') : false },
  ];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
      {items
        .filter((item) => item.show)
        .map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href) || (item.href === '/dashboard/clients' && pathname.startsWith('/dashboard/documents'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-accent-muted text-accent' : 'text-ink-muted hover:bg-base-border/30 hover:text-ink',
              )}
            >
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
