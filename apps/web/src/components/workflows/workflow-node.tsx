'use client';

import { cn } from '@/lib/utils';
import { Play, Square, GitFork, Cog, Terminal, ArrowDown, GripVertical, X } from 'lucide-react';
import type { DragEvent } from 'react';

export type NodeType = 'start' | 'agentAction' | 'condition' | 'toolCall' | 'end';

export interface WorkflowNodeData {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  config?: Record<string, unknown>;
}

interface WorkflowNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onDragStart?: (e: DragEvent) => void;
  className?: string;
}

const nodeConfig: Record<NodeType, { icon: typeof Play; color: string; border: string }> = {
  start: {
    icon: Play,
    color: 'text-green-500',
    border: 'border-green-500/50',
  },
  agentAction: {
    icon: Cog,
    color: 'text-blue-500',
    border: 'border-blue-500/50',
  },
  condition: {
    icon: GitFork,
    color: 'text-yellow-500',
    border: 'border-yellow-500/50',
  },
  toolCall: {
    icon: Terminal,
    color: 'text-purple-500',
    border: 'border-purple-500/50',
  },
  end: {
    icon: Square,
    color: 'text-red-500',
    border: 'border-red-500/50',
  },
};

export function WorkflowNode({
  data,
  selected,
  onSelect,
  onDelete,
  onDragStart,
  className,
}: WorkflowNodeProps) {
  const cfg = nodeConfig[data.type];
  const Icon = cfg.icon;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg border-2 bg-card px-4 py-3 shadow-sm transition-all cursor-pointer select-none',
        'hover:shadow-md',
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
        cfg.border,
        className,
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className={cn('rounded-md p-2 bg-muted', cfg.color)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{data.label}</p>
        {data.description && (
          <p className="text-xs text-muted-foreground truncate">{data.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center">
          <ArrowDown className="h-3 w-3 text-muted-foreground/60" />
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
