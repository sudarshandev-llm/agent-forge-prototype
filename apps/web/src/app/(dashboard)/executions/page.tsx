'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { apiClient } from '@/lib/api-client';
import { formatDate, formatNumber } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Search,
  Activity,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface Execution {
  id: string;
  agentId: string;
  agentName: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  input: string;
  output?: string;
  duration: number;
  tokensUsed: number;
  steps: number;
  createdAt: string;
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '20',
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await apiClient.get('/executions', params);
      setExecutions(response.data as Execution[]);
      if (response.meta) {
        setTotalPages(response.meta.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const statusIcon = (status: Execution['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executions</h1>
          <p className="text-muted-foreground">View and monitor agent execution history.</p>
        </div>
        <Button variant="outline" onClick={() => fetchExecutions()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by agent name or input..."
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
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Failed to load executions</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchExecutions}>
              Retry
            </Button>
          </div>
        </div>
      ) : executions.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No executions found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Execute an agent to see results here'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {executions.map((exec) => (
            <Link key={exec.id} href={`/dashboard/executions/${exec.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {statusIcon(exec.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{exec.agentName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {exec.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{exec.steps} steps</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{exec.input}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{exec.duration}ms</span>
                      <span>{formatNumber(exec.tokensUsed)} tokens</span>
                      <span>{formatDate(exec.createdAt, 'relative')}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
