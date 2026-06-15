'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import {
  Bot,
  ArrowLeft,
  Play,
  Pencil,
  Trash2,
  Copy,
  Clock,
  Activity,
  Brain,
  Wrench,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { ExecutionTimeline } from '@/components/dashboard/execution-timeline';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  capabilities: string[];
  tools: Array<{ id: string; name: string }>;
  memory: {
    type: string;
    maxMessages: number;
    vectorSearch: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Execution {
  id: string;
  status: 'success' | 'failed' | 'running';
  input: string;
  output: string;
  duration: number;
  tokensUsed: number;
  createdAt: string;
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
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execInput, setExecInput] = useState('');

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.agents.get(params.id as string);
      setAgent(response.data as Agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchExecutions = useCallback(async () => {
    try {
      const response = await apiClient.get(`/agents/${params.id}/executions`);
      setExecutions(response.data as Execution[]);
    } catch {
      // Silently fail for executions
    }
  }, [params.id]);

  useEffect(() => {
    fetchAgent();
    fetchExecutions();
  }, [fetchAgent, fetchExecutions]);

  const handleExecute = async () => {
    if (!execInput.trim()) return;
    setExecuting(true);
    try {
      const result = await apiClient.agents.execute(params.id as string, { input: execInput });
      addToast('Agent executed successfully', 'success');
      setExecInput('');
      fetchExecutions();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Execution failed', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.agents.delete(params.id as string);
      addToast('Agent deleted successfully', 'success');
      router.push('/dashboard/agents');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete agent', 'error');
    }
  };

  const handleDuplicate = async () => {
    try {
      await apiClient.agents.fork(params.id as string, `${agent?.name} (Copy)`);
      addToast('Agent duplicated successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to duplicate agent', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Agent not found</h3>
          <p className="text-sm text-muted-foreground">{error || 'This agent does not exist'}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/agents')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/agents')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
              <Badge
                variant={
                  agent.status === 'active'
                    ? 'success'
                    : agent.status === 'error'
                      ? 'destructive'
                      : agent.status === 'draft'
                        ? 'warning'
                        : 'secondary'
                }
              >
                {agent.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/agents/${params.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{agent.model}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{agent.maxTokens} max</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{formatDate(agent.createdAt, 'short')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Execute</CardTitle>
              <CardDescription>Test your agent with a sample input.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Enter input for the agent..."
                  value={execInput}
                  onChange={(e) => setExecInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                />
                <Button onClick={handleExecute} disabled={executing || !execInput.trim()}>
                  {executing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Execute
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary">
                    {cap}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-md bg-muted p-4 text-sm font-mono whitespace-pre-wrap">
                {agent.systemPrompt || 'No system prompt configured'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-medium">{agent.temperature}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Tokens</p>
                  <p className="font-medium">{agent.maxTokens}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Connected Tools</p>
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool) => (
                    <Badge key={tool.id} variant="outline" className="gap-1">
                      <Wrench className="h-3 w-3" />
                      {tool.name}
                    </Badge>
                  ))}
                  {agent.tools.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tools configured</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {executions.slice(0, 3).map((exec) => (
              <Card
                key={exec.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setSelectedExecution(exec)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {exec.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : exec.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    <span className="text-xs text-muted-foreground">{exec.duration}ms</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{exec.input}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(exec.createdAt, 'relative')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {executions.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No executions yet. Try running the agent above.
            </div>
          )}

          {selectedExecution && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Execution Details</CardTitle>
                  <CardDescription>ID: {selectedExecution.id}</CardDescription>
                </div>
                <Badge
                  variant={
                    selectedExecution.status === 'success'
                      ? 'success'
                      : selectedExecution.status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {selectedExecution.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedExecution.duration}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tokens Used</p>
                    <p className="font-medium">{selectedExecution.tokensUsed}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Steps</p>
                    <p className="font-medium">{selectedExecution.steps?.length || 0}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Input</p>
                  <pre className="rounded-md bg-muted p-3 text-sm font-mono whitespace-pre-wrap">
                    {selectedExecution.input}
                  </pre>
                </div>
                {selectedExecution.output && (
                  <div>
                    <p className="text-sm font-medium mb-1">Output</p>
                    <pre className="rounded-md bg-muted p-3 text-sm font-mono whitespace-pre-wrap">
                      {selectedExecution.output}
                    </pre>
                  </div>
                )}
                {selectedExecution.steps && selectedExecution.steps.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-4">Execution Timeline</p>
                    <ExecutionTimeline steps={selectedExecution.steps} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{agent.memory.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Messages</p>
                  <p className="font-medium">{agent.memory.maxMessages}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Vector Search:</p>
                {agent.memory.vectorSearch ? (
                  <Badge variant="success">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
