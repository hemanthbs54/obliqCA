'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useMe } from '@/hooks/queries';
import { Button } from '@/components/ui/Button';
import { RoleBadge } from '@/components/ui/StatusBadge';
import { Logo } from '@/components/layout/Logo';

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  async function handleLogout() {
    await createClient().auth.signOut();
    queryClient.clear();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-base-border/60 px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-ink-muted hover:bg-base-border/30 hover:text-ink md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="md:hidden">
          <Logo />
        </span>
        {me && (
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <span className="text-xs uppercase tracking-wide text-ink-faint">Firm</span>
            <span className="truncate text-sm font-semibold text-ink" data-testid="firm-name">
              {me.firm.name}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {me && (
          <>
            <span className="hidden text-sm text-ink sm:inline">{me.user.full_name}</span>
            <RoleBadge role={me.role} />
          </>
        )}
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
