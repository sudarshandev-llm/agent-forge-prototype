'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ChatInterface } from '@/components/chat-interface';
import { ExecutionTimeline } from '@/components/execution-timeline';
import { useUIStore } from '@/store/ui-store';
import { formatDate } from '@/lib/utils';
import {
  Bot,
  ArrowLeft,
  Pencil,
  Trash2,
  Play,
  Clock,
  Brain,
  Wrench,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
} from 'lucide-react';

const mockAgent = {
  id: '1',
  name: 'Customer Support Agent',
  description: 'Handles customer inquiries and support tickets with contextual responses.',
  status: 'active' as const,
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: 'You are a helpful customer support agent...',
  tools: [
    { id: 'web_search', name: 'Web Search' },
    { id: 'code_runner', name: 'Code Runner' },
    { id: 'ticketing', name: 'Ticketing System' },
  ],
  memory: { type: 'conversation', maxMessages: 50, vectorSearch: false },
  createdAt: new Date(Date.now() - 604800000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
};

const mockExecutions = [
  {
    id: '1',
    status: 'success' as const,
    input: 'Help me reset my password',
    output: 'Sure! I can help you reset your password...',
    duration: 2340,
    tokensUsed: 456,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    steps: [],
  },
  {
    id: '2',
    status: 'failed' as const,
    input: 'What is my order status?',
    output: '',
    duration: 1200,
    tokensUsed: 123,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    steps: [],
  },
  {
    id: '3',
    status: 'success' as const,
    input: 'Cancel my subscription',
    output: 'Your subscription has been cancelled...',
    duration: 3100,
    tokensUsed: 678,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    steps: [],
  },
];

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const [agent] = useState(mockAgent);

  const handleDelete = () => {
    addToast('Agent deleted successfully', 'success');
    router.push('/agents');
  };

  const handleDuplicate = () => {
    addToast('Agent duplicated successfully', 'success');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/agents')}>
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
                      : 'warning'
                }
              >
                {agent.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/agents/${params.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{formatDate(agent.createdAt, 'short')}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{agent.tools.length} configured</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Summary</CardTitle>
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
                <div>
                  <p className="text-sm text-muted-foreground">Memory Type</p>
                  <p className="font-medium capitalize">{agent.memory.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Messages</p>
                  <p className="font-medium">{agent.memory.maxMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.tools.map((tool) => (
                  <Badge key={tool.id} variant="outline" className="gap-1">
                    <Wrench className="h-3 w-3" />
                    {tool.name}
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

        <TabsContent value="chat">
          <Card>
            <CardContent className="p-0">
              <div className="h-[500px]">
                <ChatInterface agentId={agent.id} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {mockExecutions.map((exec) => (
              <Card key={exec.id} className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {exec.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
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
          {mockExecutions.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No executions yet
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Agent Configuration</CardTitle>
              <CardDescription>
                Modify your agent settings here. Changes take effect on next execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{agent.name}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Model</p>
                <p className="text-sm text-muted-foreground">{agent.model}</p>
              </div>
              <Separator />
              <Button onClick={() => router.push(`/agents/${params.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
