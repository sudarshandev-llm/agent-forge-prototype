'use client';

import { useUIStore } from '@/store/ui-store';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className={cn('transition-all duration-300', sidebarOpen ? 'lg:pl-64' : 'lg:pl-16')}>
        <Navbar />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
