'use client';

import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, Users, Workflow, Play, Settings, AlertCircle, CheckCircle2, LucideIcon } from 'lucide-react';

interface Activity {
  id: string;
  type: 'agent_created' | 'agent_executed' | 'team_updated' | 'workflow_run' | 'settings_changed' | 'error' | 'success';
  user: {
    name: string;
    avatar?: string;
  };
  description: string;
  timestamp: string;
  status?: 'success' | 'failed' | 'pending';
}

const activityIcons: Record<Activity['type'], LucideIcon> = {
  agent_created: Bot,
  agent_executed: Play,
  team_updated: Users,
  workflow_run: Workflow,
  settings_changed: Settings,
  error: AlertCircle,
  success: CheckCircle2,
};

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <ScrollArea className={cn('h-[400px]', className)}>
      <div className="space-y-1">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="text-xs">
                  {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activity.user.name}</span>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {activity.status && (
                    <Badge
                      variant={
                        activity.status === 'success' ? 'success' :
                        activity.status === 'failed' ? 'destructive' : 'secondary'
                      }
                      className="ml-auto text-[10px]"
                    >
                      {activity.status}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground/60">
                  {formatDate(activity.timestamp, 'relative')}
                </p>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No recent activity
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
