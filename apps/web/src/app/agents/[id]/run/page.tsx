'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExecutionLog } from '@/components/execution-log';
import { ChatInterface } from '@/components/chat-interface';
import { cn, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Send,
  Loader2,
  PanelLeft,
  PanelRightClose,
  Bot,
  User,
  Brain,
  Zap,
  Eye,
  Check,
  Clock,
  Cpu,
} from 'lucide-react';

interface ExecutionStep {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'result';
  content: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  duration?: number;
  details?: string;
}

export default function AgentRunPage() {
  const params = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>(
    [],
  );
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [tokenUsed, setTokenUsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isExecuting) return;

    setMessages((prev) => [...prev, { role: 'user', content: input.trim() }]);
    setInput('');
    setIsExecuting(true);
    setSteps([]);
    setTokenUsed(0);
    startTimeRef.current = Date.now();

    const stepIds = ['s1', 's2', 's3', 's4'];
    const mockSteps: ExecutionStep[] = [
      {
        id: stepIds[0],
        type: 'thought',
        content: 'Understanding the user query...',
        status: 'running',
        timestamp: new Date().toISOString(),
      },
    ];
    setSteps(mockSteps);

    setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepIds[0]
            ? {
                ...s,
                status: 'completed' as const,
                duration: 450,
                details: 'Identified intent: user needs password reset assistance',
              }
            : s,
        ),
      );
      setTimeout(() => {
        setSteps((prev) => [
          ...prev.map((s) => (s.id === stepIds[0] ? s : s)),
          {
            id: stepIds[1],
            type: 'action',
            content: 'Searching knowledge base for password reset flow...',
            status: 'running',
            timestamp: new Date().toISOString(),
          },
        ]);
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s) =>
              s.id === stepIds[1] ? { ...s, status: 'completed' as const, duration: 820 } : s,
            ),
          );
          setTimeout(() => {
            setSteps((prev) => [
              ...prev,
              {
                id: stepIds[2],
                type: 'observation',
                content: 'Found 3 relevant articles about password reset',
                status: 'completed' as const,
                duration: 120,
                timestamp: new Date().toISOString(),
                details: 'Article titles: Reset via email, Reset via SMS, Admin reset',
              },
            ]);
            setTimeout(() => {
              setSteps((prev) => [
                ...prev,
                {
                  id: stepIds[3],
                  type: 'result',
                  content:
                    'I can help you reset your password. Would you like to reset via email or SMS?',
                  status: 'completed' as const,
                  duration: 650,
                  timestamp: new Date().toISOString(),
                },
              ]);
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content:
                    'I can help you reset your password. Would you like to reset via email or SMS verification?',
                },
              ]);
              setTokenUsed(342);
              setDuration(Date.now() - startTimeRef.current);
              setIsExecuting(false);
            }, 800);
          }, 400);
        }, 600);
      }, 500);
    }, 800);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/agents/${params.id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-sm font-semibold">Agent Run</h2>
              <p className="text-xs text-muted-foreground">Agent ID: {params.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {tokenUsed > 0 && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                {tokenUsed} tokens
              </span>
            )}
            {duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {(duration / 1000).toFixed(1)}s
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center max-w-md">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Start a Conversation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Send a message to the agent and watch its ReAct loop in real-time on the sidebar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-4 py-2',
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isExecuting && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())
              }
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim() || isExecuting}>
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="w-96 border-l bg-background flex flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Execution Steps</h3>
            </div>
            {isExecuting && (
              <Badge variant="secondary" className="text-[10px] animate-pulse">
                Running
              </Badge>
            )}
          </div>
          <div className="flex-1">
            <ExecutionLog steps={steps} />
          </div>
          {steps.length > 0 && !isExecuting && (
            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Steps: {steps.length}</span>
                <span>Tokens: {tokenUsed}</span>
                <span>Duration: {(duration / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
