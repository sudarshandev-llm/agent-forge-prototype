'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { Brain, Zap, Eye, Check, Loader2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface ExecutionStep {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'result';
  content: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  duration?: number;
  details?: string;
}

interface ExecutionLogProps {
  steps: ExecutionStep[];
  className?: string;
}

const stepConfig = {
  thought: { icon: Brain, label: 'Thought', color: 'text-blue-500', border: 'border-blue-500' },
  action: { icon: Zap, label: 'Action', color: 'text-amber-500', border: 'border-amber-500' },
  observation: { icon: Eye, label: 'Observation', color: 'text-purple-500', border: 'border-purple-500' },
  result: { icon: Check, label: 'Result', color: 'text-green-500', border: 'border-green-500' },
};

function StepStatus({ status }: { status: ExecutionStep['status'] }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  if (status === 'completed') return <Check className="h-4 w-4 text-green-500" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
  return null;
}

export function ExecutionLog({ steps, className }: ExecutionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <ScrollArea ref={scrollRef} className={cn('h-full', className)}>
      <div className="space-y-0 p-4">
        {steps.map((step, index) => {
          const config = stepConfig[step.type];
          const Icon = config.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast && <div className="absolute left-[15px] top-8 h-full w-px bg-border" />}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
                    config.border,
                    step.status === 'running' && 'animate-pulse',
                    step.status === 'failed' && 'border-red-500',
                  )}
                >
                  {step.status === 'running' && step.type === 'thought' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : (
                    <Icon className={cn('h-4 w-4', config.color)} />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{config.label}</span>
                  <StepStatus status={step.status} />
                  {step.duration && (
                    <span className="text-xs text-muted-foreground ml-auto">{step.duration}ms</span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(step.timestamp, 'relative')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.content}</p>
                {step.details && (
                  <details className="mt-1">
                    <summary className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      <ChevronRight className="h-3 w-3" />
                      Details
                    </summary>
                    <pre className="mt-1 rounded-md bg-muted p-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                      {step.details}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          );
        })}
        {steps.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No execution steps yet
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
