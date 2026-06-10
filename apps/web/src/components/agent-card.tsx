'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate, getInitials, truncate } from '@/lib/utils';
import { Bot, Play, Pencil, Trash2, MoreHorizontal, Cpu } from 'lucide-react';

interface AgentCardAgent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'error';
  model: string;
  lastRun?: string;
  tools?: number;
}

interface AgentCardProps {
  agent: AgentCardAgent;
  onRun?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  error: 'bg-red-500',
};

const statusVariants: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  idle: 'warning',
  error: 'destructive',
};

export function AgentCard({ agent, onRun, onEdit, onDelete, className }: AgentCardProps) {
  return (
    <Link href={`/agents/${agent.id}`} className="block">
      <Card className={cn('group transition-all hover:shadow-md hover:border-primary/50 h-full', className)}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(agent.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{agent.name}</span>
                <Badge variant={statusVariants[agent.status]} className="text-[10px]">
                  {agent.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{agent.model}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRun && (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onRun(agent.id); }}>
                  <Play className="mr-2 h-4 w-4" /> Run
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(agent.id); }}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => { e.preventDefault(); onDelete(agent.id); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">{truncate(agent.description, 100)}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            <span>{agent.model}</span>
            {agent.tools !== undefined && (
              <>
                <span className="text-muted-foreground/40">|</span>
                <Bot className="h-3.5 w-3.5" />
                <span>{agent.tools} tools</span>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t px-6 py-3">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', statusStyles[agent.status])} />
            <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
          </div>
          <div className="flex items-center gap-2">
            {agent.lastRun && (
              <span className="text-xs text-muted-foreground">{formatDate(agent.lastRun, 'relative')}</span>
            )}
            {onRun && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.preventDefault(); onRun(agent.id); }}
              >
                <Play className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
