'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Workflow,
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Copy,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn, formatDate, formatNumber } from '@/lib/utils';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'error';
  nodeCount: number;
  runCount: number;
  lastRun?: string;
  updatedAt: string;
}

const mockWorkflows: WorkflowItem[] = [
  {
    id: '1',
    name: 'Customer Onboarding',
    description: 'Automated onboarding flow with email verification and profile setup.',
    status: 'active',
    nodeCount: 8,
    runCount: 1523,
    lastRun: '2024-06-10T09:15:00Z',
    updatedAt: '2024-06-08T14:00:00Z',
  },
  {
    id: '2',
    name: 'Content Review Pipeline',
    description: 'Multi-stage content review with AI analysis and human approval gates.',
    status: 'active',
    nodeCount: 12,
    runCount: 892,
    lastRun: '2024-06-09T16:30:00Z',
    updatedAt: '2024-06-07T10:00:00Z',
  },
  {
    id: '3',
    name: 'Data Sync Workflow',
    description: 'Synchronize data between CRM, ERP, and analytics platforms.',
    status: 'draft',
    nodeCount: 5,
    runCount: 0,
    updatedAt: '2024-06-05T08:00:00Z',
  },
  {
    id: '4',
    name: 'Incident Response',
    description: 'Automated incident detection, alerting, and response coordination.',
    status: 'error',
    nodeCount: 15,
    runCount: 234,
    lastRun: '2024-06-09T22:00:00Z',
    updatedAt: '2024-06-09T22:05:00Z',
  },
  {
    id: '5',
    name: 'Lead Qualification',
    description: 'Score and route leads based on behavior, firmographics, and intent.',
    status: 'active',
    nodeCount: 6,
    runCount: 3456,
    lastRun: '2024-06-10T08:00:00Z',
    updatedAt: '2024-06-10T08:01:00Z',
  },
];

const statusConfig = {
  active: { icon: CheckCircle2, label: 'Active', class: 'text-green-500' },
  draft: { icon: Clock, label: 'Draft', class: 'text-yellow-500' },
  error: { icon: AlertCircle, label: 'Error', class: 'text-destructive' },
};

export default function WorkflowsPage() {
  const [search, setSearch] = useState('');

  const filtered = mockWorkflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Build and manage automated workflows for your agents.
          </p>
        </div>
        <Button asChild>
          <Link href="/workflows/new" className="gap-2">
            <Plus className="h-4 w-4" />
            New Workflow
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Workflow className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No workflows found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {search
              ? 'Try a different search term.'
              : 'Create your first workflow to automate agent tasks.'}
          </p>
          {!search && (
            <Button asChild className="mt-4">
              <Link href="/workflows/new" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workflow
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((workflow) => {
            const status = statusConfig[workflow.status];
            const StatusIcon = status.icon;
            return (
              <Link key={workflow.id} href={`/workflows/${workflow.id}`}>
                <Card className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'rounded-md p-2',
                            workflow.status === 'active' && 'bg-green-500/10',
                            workflow.status === 'draft' && 'bg-yellow-500/10',
                            workflow.status === 'error' && 'bg-destructive/10',
                          )}
                        >
                          <Workflow
                            className={cn(
                              'h-4 w-4',
                              workflow.status === 'active' && 'text-green-500',
                              workflow.status === 'draft' && 'text-yellow-500',
                              workflow.status === 'error' && 'text-destructive',
                            )}
                          />
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Play className="h-4 w-4" /> Run
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Copy className="h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {workflow.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {workflow.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn('h-4 w-4', status.class)} />
                        <span className={cn('font-medium', status.class)}>{status.label}</span>
                      </div>
                      <span className="text-muted-foreground">{workflow.nodeCount} nodes</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatNumber(workflow.runCount)} runs</span>
                      <span>Updated {formatDate(workflow.updatedAt, 'relative')}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
