'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

export function Topbar({ email }: { email: string | null }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-base-border/60 px-6">
      <div />
      <div className="flex items-center gap-4">
        {email && <span className="text-sm text-ink-muted">{email}</span>}
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </header>
  );
}
