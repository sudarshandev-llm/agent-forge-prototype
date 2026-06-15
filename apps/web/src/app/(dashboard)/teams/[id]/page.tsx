'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { formatDate, getInitials, truncate } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import {
  ArrowLeft,
  Bot,
  Users,
  Activity,
  UserPlus,
  Settings,
  Mail,
  Clock,
  Shield,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  avatar?: string;
  joinedAt: string;
}

interface TeamAgent {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  agents: TeamAgent[];
  createdAt: string;
  updatedAt: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useUIStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.teams.get(params.id as string);
      setTeam(response.data as Team);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Team not found</h3>
          <p className="text-sm text-muted-foreground">{error || 'This team does not exist'}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/teams')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/teams')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-muted-foreground">{team.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" /> Add Member
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{team.members?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{team.agents?.length || 0}</span>
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
              <span className="text-lg font-semibold">{formatDate(team.createdAt, 'short')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage who has access to this team.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        <Shield className="mr-1 h-3 w-3" />
                        {member.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Joined {formatDate(member.joinedAt, 'relative')}
                      </span>
                    </div>
                  </div>
                ))}
                {(!team.members || team.members.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No members yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Team Agents</CardTitle>
              <CardDescription>Agents assigned to this team.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {team.agents?.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {truncate(agent.description, 80)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        agent.status === 'active'
                          ? 'success'
                          : agent.status === 'error'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                ))}
                {(!team.agents || team.agents.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No agents assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                <Activity className="mr-2 h-4 w-4" />
                Activity feed coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
