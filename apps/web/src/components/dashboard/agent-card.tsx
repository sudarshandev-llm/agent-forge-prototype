'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn, formatDate, getInitials, truncate } from '@/lib/utils';
import { Bot, Play, MoreHorizontal, Copy, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft' | 'error';
  model?: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

interface AgentCardProps {
  agent: Agent;
  view?: 'grid' | 'list';
  onExecute?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const statusVariants: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  active: 'success',
  inactive: 'secondary',
  draft: 'warning',
  error: 'destructive',
};

export function AgentCard({
  agent,
  view = 'grid',
  onExecute,
  onDelete,
  onDuplicate,
}: AgentCardProps) {
  if (view === 'list') {
    return (
      <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(agent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/agents/${agent.id}`}
              className="font-medium hover:underline truncate"
            >
              {agent.name}
            </Link>
            <Badge variant={statusVariants[agent.status]} className="text-[10px]">
              {agent.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{agent.description}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          {agent.model && <span>{agent.model}</span>}
          <span>{agent.capabilities.length} tools</span>
          <span>{formatDate(agent.updatedAt, 'relative')}</span>
        </div>
        <div className="flex items-center gap-1">
          {onExecute && (
            <Button variant="ghost" size="icon" onClick={() => onExecute(agent.id)}>
              <Play className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/agents/${agent.id}`}>View</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/agents/${agent.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(agent.id)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(agent.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(agent.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link href={`/dashboard/agents/${agent.id}`} className="font-semibold hover:underline">
              {agent.name}
            </Link>
            <Badge variant={statusVariants[agent.status]} className="ml-2 text-[10px]">
              {agent.status}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/agents/${agent.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/agents/${agent.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(agent.id)}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(agent.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {truncate(agent.description, 120)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 4).map((cap) => (
            <Badge key={cap} variant="secondary" className="text-[10px]">
              {cap}
            </Badge>
          ))}
          {agent.capabilities.length > 4 && (
            <Badge variant="outline" className="text-[10px]">
              +{agent.capabilities.length - 4}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t px-6 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bot className="h-3.5 w-3.5" />
          <span>{agent.model || 'Default'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDate(agent.createdAt, 'relative')}
          </span>
          {onExecute && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onExecute(agent.id)}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
