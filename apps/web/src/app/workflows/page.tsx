'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import {
  Workflow, Plus, Search, Play, MoreHorizontal, Copy, Trash2,
  CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'error';
  nodeCount: number;
  runCount: number;
  lastRun?: string;
  trigger: 'manual' | 'scheduled' | 'webhook';
  updatedAt: string;
}

const mockWorkflows: WorkflowItem[] = [
  { id: '1', name: 'Customer Onboarding', description: 'Automated onboarding flow with email verification and profile setup.', status: 'active', nodeCount: 8, runCount: 1523, lastRun: '2024-06-10T09:15:00Z', trigger: 'webhook', updatedAt: '2024-06-08T14:00:00Z' },
  { id: '2', name: 'Content Review Pipeline', description: 'Multi-stage content review with AI analysis and human approval gates.', status: 'active', nodeCount: 12, runCount: 892, lastRun: '2024-06-09T16:30:00Z', trigger: 'manual', updatedAt: '2024-06-07T10:00:00Z' },
  { id: '3', name: 'Data Sync Workflow', description: 'Synchronize data between CRM, ERP, and analytics platforms.', status: 'draft', nodeCount: 5, runCount: 0, trigger: 'scheduled', updatedAt: '2024-06-05T08:00:00Z' },
  { id: '4', name: 'Incident Response', description: 'Automated incident detection, alerting, and response coordination.', status: 'error', nodeCount: 15, runCount: 234, lastRun: '2024-06-09T22:00:00Z', trigger: 'webhook', updatedAt: '2024-06-09T22:05:00Z' },
  { id: '5', name: 'Lead Qualification', description: 'Score and route leads based on behavior, firmographics, and intent.', status: 'active', nodeCount: 6, runCount: 3456, lastRun: '2024-06-10T08:00:00Z', trigger: 'webhook', updatedAt: '2024-06-10T08:01:00Z' },
];

const statusConfig = {
  active: { icon: CheckCircle2, label: 'Active', color: 'text-green-500', bg: 'bg-green-500/10' },
  draft: { icon: Clock, label: 'Draft', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  error: { icon: AlertCircle, label: 'Error', color: 'text-destructive', bg: 'bg-destructive/10' },
};

const triggerLabels: Record<string, string> = {
  manual: 'Manual',
  scheduled: 'Scheduled',
  webhook: 'Webhook',
};

export default function WorkflowsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflows] = useState<WorkflowItem[]>(mockWorkflows);

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workflows, search, statusFilter]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">Build and manage automated workflows.</p>
        </div>
        <Link href="/workflows/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Workflow
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Workflow className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No workflows found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {search ? 'Try a different search term' : 'Create your first workflow to automate agent tasks.'}
          </p>
          {!search && (
            <Link href="/workflows/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create Workflow
              </Button>
            </Link>
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
                      <div className={cn('rounded-md p-2', status.bg)}>
                        <StatusIcon className={cn('h-4 w-4', status.color)} />
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors mt-2">
                      {workflow.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">{workflow.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn('h-4 w-4', status.color)} />
                        <span className={cn('font-medium', status.color)}>{status.label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{triggerLabels[workflow.trigger]}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{workflow.nodeCount} nodes</span>
                      <span>{formatNumber(workflow.runCount)} runs</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {workflow.lastRun ? (
                        <span>Last run {formatDate(workflow.lastRun, 'relative')}</span>
                      ) : (
                        <span>Never run</span>
                      )}
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
