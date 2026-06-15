'use client';

import { useState } from 'react';
import { cn, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Brain, Zap, Eye, Check, Loader2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface TimelineStep {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'result';
  content: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  duration?: number;
  details?: string;
}

interface ExecutionTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

const stepColors: Record<TimelineStep['type'], { bg: string; text: string; border: string }> = {
  thought: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  action: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  observation: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  result: {
    bg: 'bg-green-50 dark:bg-green-950',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
};

const stepIcons = {
  thought: Brain,
  action: Zap,
  observation: Eye,
  result: Check,
};

const totalDuration = (steps: TimelineStep[]) =>
  steps.reduce((acc, s) => acc + (s.duration || 0), 0);

export function ExecutionTimeline({ steps, className }: ExecutionTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const total = totalDuration(steps);

  return (
    <div className={cn('space-y-2', className)}>
      {steps.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span>{steps.length} steps</span>
          <span>{total}ms total</span>
        </div>
      )}

      {steps.map((step) => {
        const colors = stepColors[step.type];
        const Icon = stepIcons[step.type];
        const isExpanded = expandedStep === step.id;

        return (
          <Card
            key={step.id}
            className={cn(
              'overflow-hidden transition-all cursor-pointer hover:shadow-sm',
              colors.border,
            )}
            onClick={() => setExpandedStep(isExpanded ? null : step.id)}
          >
            <div className={cn('flex items-center gap-3 p-3', colors.bg)}>
              <div
                className={cn('flex h-8 w-8 items-center justify-center rounded-full', colors.text)}
              >
                {step.status === 'running' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step.status === 'failed' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{step.type}</span>
                  <Badge
                    variant={
                      step.status === 'completed'
                        ? 'success'
                        : step.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {step.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{step.content}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                {step.duration && (
                  <div className="flex items-center gap-1">
                    <div
                      className="h-1.5 rounded-full bg-primary/30"
                      style={{ width: `${Math.max((step.duration / (total || 1)) * 60, 8)}px` }}
                    />
                    <span>{step.duration}ms</span>
                  </div>
                )}
                <span>{formatDate(step.timestamp, 'relative')}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
            {isExpanded && step.details && (
              <div className="border-t p-3">
                <pre className="rounded-md bg-muted p-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {step.details}
                </pre>
              </div>
            )}
          </Card>
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
