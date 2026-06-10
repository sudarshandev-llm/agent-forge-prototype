'use client';

import { cn } from '@/lib/utils';
import { Play, Square, GitFork, Cog, Terminal, GripVertical } from 'lucide-react';
import type { DragEvent } from 'react';

const nodeTypes = [
  {
    type: 'start' as const,
    label: 'Start',
    description: 'Trigger the workflow',
    icon: Play,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    type: 'agentAction' as const,
    label: 'Agent Action',
    description: 'Run an AI agent task',
    icon: Cog,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    type: 'condition' as const,
    label: 'Condition',
    description: 'Branch based on logic',
    icon: GitFork,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    type: 'toolCall' as const,
    label: 'Tool Call',
    description: 'Execute an external tool',
    icon: Terminal,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    type: 'end' as const,
    label: 'End',
    description: 'Complete the workflow',
    icon: Square,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
];

interface NodePaletteProps {
  className?: string;
}

export function NodePalette({ className }: NodePaletteProps) {
  const handleDragStart = (e: DragEvent, type: string, label: string) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type, label }),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Nodes
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drag nodes onto the canvas
        </p>
      </div>

      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => handleDragStart(e, node.type, node.label)}
            className={cn(
              'flex items-center gap-3 rounded-md border p-3 cursor-grab active:cursor-grabbing transition-all',
              'hover:border-primary/50 hover:shadow-sm hover:bg-accent/50',
              'active:scale-[0.98]',
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/30" />
            <div className={cn('rounded-md p-2', node.bg, node.color)}>
              <node.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{node.label}</p>
              <p className="text-xs text-muted-foreground">{node.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
