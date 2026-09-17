'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ErrorState } from '@/components/ui/EmptyState';
import { useMe } from '@/hooks/queries';
import { ApiError } from '@/lib/api';

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { error } = useMe();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {error ? (
            <ErrorState
              title={error instanceof ApiError && error.statusCode === 403 ? 'No firm access' : 'Could not reach the API'}
              message={
                error instanceof ApiError && error.statusCode === 403
                  ? 'Your account is not a member of any firm yet. Ask a partner to add you.'
                  : `${error.message}. Check that the API is running and NEXT_PUBLIC_API_URL is correct.`
              }
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
