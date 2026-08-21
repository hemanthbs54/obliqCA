'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';

interface TopbarProps {
  email: string | null;
  onOpenMobileNav: () => void;
}

export function Topbar({ email, onOpenMobileNav }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-base-border/60 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
          className="rounded-lg p-1.5 text-ink-muted hover:bg-base-border/30 hover:text-ink md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M3 6h16M3 11h16M3 16h16"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="md:hidden">
          <Logo />
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {email && <span className="hidden text-sm text-ink-muted sm:inline">{email}</span>}
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
