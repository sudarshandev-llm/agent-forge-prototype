'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AgentCard } from '@/components/agent-card';
import { useUIStore } from '@/store/ui-store';
import { Plus, Search, Bot, RefreshCw } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'error';
  model: string;
  lastRun?: string;
  tools?: number;
}

const mockAgents: Agent[] = [
  { id: '1', name: 'Customer Support Agent', description: 'Handles customer inquiries and support tickets with contextual responses.', status: 'active', model: 'gpt-4o', lastRun: new Date(Date.now() - 300000).toISOString(), tools: 4 },
  { id: '2', name: 'Data Analyst', description: 'Analyzes datasets and generates visual reports.', status: 'active', model: 'claude-3-5-sonnet', lastRun: new Date(Date.now() - 7200000).toISOString(), tools: 3 },
  { id: '3', name: 'Code Reviewer', description: 'Reviews pull requests and suggests improvements.', status: 'idle', model: 'gpt-4-turbo', lastRun: new Date(Date.now() - 86400000).toISOString(), tools: 2 },
  { id: '4', name: 'Web Scraper', description: 'Extracts and structures data from websites.', status: 'error', model: 'llama-3-70b', lastRun: new Date(Date.now() - 3600000).toISOString(), tools: 5 },
  { id: '5', name: 'Email Assistant', description: 'Drafts, summarizes, and manages email communications.', status: 'idle', model: 'gpt-3.5-turbo', tools: 2 },
  { id: '6', name: 'Research Agent', description: 'Conducts deep research on topics and compiles findings.', status: 'active', model: 'claude-3-opus', lastRun: new Date(Date.now() - 600000).toISOString(), tools: 6 },
];

export default function AgentsPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agents] = useState<Agent[]>(mockAgents);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
        agent.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  const handleRun = (id: string) => {
    router.push(`/agents/${id}/run`);
  };

  const handleEdit = (id: string) => {
    router.push(`/agents/${id}`);
  };

  const handleDelete = (id: string) => {
    addToast('Agent deleted successfully', 'success');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents.</p>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Agent
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setLoading(true)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4 mb-4" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No agents found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Get started by creating your first agent'}
            </p>
            {!search && (
              <Link href="/agents/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Create Agent
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onRun={handleRun}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
