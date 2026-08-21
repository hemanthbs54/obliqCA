import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardChrome } from '@/components/layout/DashboardChrome';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardChrome email={user.email ?? null}>{children}</DashboardChrome>;
}
