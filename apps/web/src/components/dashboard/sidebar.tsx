'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  LayoutDashboard,
  Workflow,
  Puzzle,
  ShoppingBag,
  BarChart3,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Bot, label: 'Agents', href: '/dashboard/agents' },
  { icon: Workflow, label: 'Workflows', href: '/dashboard/workflows' },
  { icon: Puzzle, label: 'Tools', href: '/dashboard/tools' },
  { icon: Users, label: 'Teams', href: '/dashboard/teams' },
  { icon: ShoppingBag, label: 'Marketplace', href: '/dashboard/marketplace' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-background transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <Bot className="h-6 w-6 text-primary" />
            <span>AgentForge</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto', !sidebarOpen && 'mx-auto')}
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    !sidebarOpen && 'justify-center px-2',
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
