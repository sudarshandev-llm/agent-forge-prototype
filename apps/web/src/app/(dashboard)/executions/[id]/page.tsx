'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { formatDate, formatNumber } from '@/lib/utils';
import { ExecutionTimeline } from '@/components/dashboard/execution-timeline';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Bot,
  Copy,
  RefreshCw,
  Download,
  Share2,
  Timer,
  Database,
  Zap,
} from 'lucide-react';

interface ExecutionDetail {
  id: string;
  agentId: string;
  agentName: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  input: string;
  output: string;
  duration: number;
  tokensUsed: number;
  steps: Array<{
    id: string;
    name: string;
    type: 'llm_call' | 'tool_execution' | 'memory_access' | 'output';
    status: 'completed' | 'failed' | 'running' | 'pending';
    duration?: number;
    input?: string;
    output?: string;
    error?: string;
    startedAt: string;
    completedAt?: string;
  }>;
  metrics?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    model: string;
    temperature: number;
  };
  createdAt: string;
  completedAt?: string;
}

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExecution = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/executions/${params.id}`);
      setExecution(response.data as ExecutionDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load execution');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchExecution();
  }, [fetchExecution]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Execution not found</h3>
          <p className="text-sm text-muted-foreground">{error || 'This execution does not exist'}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/executions')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Executions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/executions')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Execution Details</h1>
              <Badge
                variant={
                  execution.status === 'success' ? 'success' :
                  execution.status === 'failed' ? 'destructive' :
                  execution.status === 'running' ? 'default' : 'secondary'
                }
              >
                {execution.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Agent: <span className="font-medium">{execution.agentName}</span>
              {' '}&middot;{' '}
              {formatDate(execution.createdAt, 'long')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchExecution()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" /> Copy ID
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{execution.duration}ms</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tokens Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{formatNumber(execution.tokensUsed)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{execution.steps?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span
                className="text-lg font-semibold cursor-pointer hover:underline"
                onClick={() => router.push(`/dashboard/agents/${execution.agentId}`)}
              >
                {execution.agentName}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="io">Input / Output</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Execution Timeline</CardTitle>
              <CardDescription>Step-by-step breakdown of the execution.</CardDescription>
            </CardHeader>
            <CardContent>
              <ExecutionTimeline steps={execution.steps || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="io" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Input</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-md bg-muted p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {execution.input}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-md bg-muted p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {execution.output || 'No output generated'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Execution Metrics</CardTitle>
              <CardDescription>Detailed metrics for this execution.</CardDescription>
            </CardHeader>
            <CardContent>
              {execution.metrics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{execution.metrics.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="font-medium">{execution.metrics.temperature}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prompt Tokens</p>
                    <p className="font-medium">{formatNumber(execution.metrics.promptTokens)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Tokens</p>
                    <p className="font-medium">{formatNumber(execution.metrics.completionTokens)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="font-medium">${execution.metrics.cost.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={execution.status === 'success' ? 'success' : 'destructive'}>
                      {execution.status}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No metrics available for this execution
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
