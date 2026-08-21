import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { SidebarNav } from '@/components/layout/SidebarNav';

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-base-border/60 bg-base-raised/40 md:flex md:flex-col">
      <div className="px-5 py-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
      <SidebarNav />
    </aside>
  );
}
