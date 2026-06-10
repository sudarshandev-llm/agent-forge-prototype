'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AgentCard } from '@/components/dashboard/agent-card';
import { apiClient } from '@/lib/api-client';
import { useUIStore } from '@/store/ui-store';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  Loader2,
  Bot,
  RefreshCw,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  model?: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      params.sort = sortBy;
      const response = await apiClient.agents.list(params);
      setAgents(response.data as Agent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.agents.delete(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      addToast('Agent deleted successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete agent', 'error');
    }
  };

  const handleExecute = async (id: string) => {
    router.push(`/dashboard/agents/${id}`);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await apiClient.agents.fork(id);
      addToast('Agent duplicated successfully', 'success');
      fetchAgents();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to duplicate agent', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents.</p>
        </div>
        <Link href="/dashboard/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Agent
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="mr-2 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Recently Updated</SelectItem>
              <SelectItem value="createdAt">Recently Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchAgents()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="flex rounded-md border">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none rounded-l-md"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-none rounded-r-md"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4 mb-4" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )
      ) : error ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Failed to load agents</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchAgents()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No agents found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Get started by creating your first agent'}
            </p>
            {!search && (
              <Link href="/dashboard/agents/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Create Agent
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              view="grid"
              onExecute={handleExecute}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-[1fr_200px_100px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Agent</span>
            <span>Details</span>
            <span>Actions</span>
          </div>
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              view="list"
              onExecute={handleExecute}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
