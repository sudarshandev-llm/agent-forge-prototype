'use client';

import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Timer,
  Loader2,
  ArrowRight,
  Brain,
  FunctionSquare,
  Database,
  LucideIcon,
} from 'lucide-react';

interface TimelineStep {
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
}

interface ExecutionTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

const stepIcons: Record<TimelineStep['type'], LucideIcon> = {
  llm_call: Brain,
  tool_execution: FunctionSquare,
  memory_access: Database,
  output: ArrowRight,
};

const typeColors: Record<TimelineStep['type'], string> = {
  llm_call: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  tool_execution: 'border-amber-500 bg-amber-50 dark:bg-amber-950',
  memory_access: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
  output: 'border-green-500 bg-green-50 dark:bg-green-950',
};

function StatusIcon({ status }: { status: TimelineStep['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'running':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    case 'pending':
      return <Timer className="h-5 w-5 text-muted-foreground" />;
  }
}

export function ExecutionTimeline({ steps, className }: ExecutionTimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, index) => {
        const Icon = stepIcons[step.type];
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && <div className="absolute left-[19px] top-10 h-full w-px bg-border" />}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2',
                  typeColors[step.type],
                  step.status === 'completed' && 'border-green-500',
                  step.status === 'failed' && 'border-red-500',
                )}
              >
                <StatusIcon status={step.status} />
              </div>
            </div>
            <Card className="flex-1 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{step.name}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {step.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                  {step.duration && <span>{step.duration}ms</span>}
                  <span>{formatDate(step.startedAt, 'relative')}</span>
                </div>
              </div>

              {step.status === 'failed' && step.error && (
                <div className="mt-2 rounded-md bg-destructive/10 p-2">
                  <p className="text-xs text-destructive font-mono">{step.error}</p>
                </div>
              )}

              {step.input && step.status !== 'pending' && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Input:</p>
                  <pre className="rounded-md bg-muted p-2 text-xs font-mono overflow-x-auto max-h-20">
                    {step.input}
                  </pre>
                </div>
              )}

              {step.output && step.status === 'completed' && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Output:</p>
                  <pre className="rounded-md bg-muted p-2 text-xs font-mono overflow-x-auto max-h-20">
                    {step.output}
                  </pre>
                </div>
              )}
            </Card>
          </div>
        );
      })}
      {steps.length === 0 && (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No execution steps recorded
        </div>
      )}
    </div>
  );
}
