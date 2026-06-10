'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { formatDate, getInitials, truncate } from '@/lib/utils';
import { ArrowLeft, Bot, Users, Activity, UserPlus, Settings, Shield, Mail, Clock, Play } from 'lucide-react';

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
  role: string;
}

const mockTeam = {
  id: '1',
  name: 'Engineering',
  description: 'Core engineering team building agent infrastructure and tooling.',
  members: [
    { id: 'u1', name: 'Alice Chen', email: 'alice@example.com', role: 'admin' as const, joinedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: 'u2', name: 'Bob Smith', email: 'bob@example.com', role: 'member' as const, joinedAt: new Date(Date.now() - 86400000 * 20).toISOString() },
    { id: 'u3', name: 'Carol Davis', email: 'carol@example.com', role: 'member' as const, joinedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: 'u4', name: 'David Lee', email: 'david@example.com', role: 'viewer' as const, joinedAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  ],
  agents: [
    { id: 'a1', name: 'Code Reviewer', description: 'Reviews PRs and suggests improvements', status: 'active', role: 'Developer' },
    { id: 'a2', name: 'Bug Triage Agent', description: 'Automatically triages and categorizes bugs', status: 'active', role: 'QA' },
    { id: 'a3', name: 'Docs Generator', description: 'Generates documentation from code', status: 'idle', role: 'Writer' },
  ],
  createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
};

const mockActivity = [
  { id: '1', type: 'agent_executed' as const, user: { name: 'Alice Chen' }, description: 'Code Reviewer analyzed PR #234', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'success' as const },
  { id: '2', type: 'team_updated' as const, user: { name: 'Bob Smith' }, description: 'Added David Lee as viewer', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', type: 'workflow_run' as const, user: { name: 'Carol Davis' }, description: 'Deployment pipeline triggered', timestamp: new Date(Date.now() - 14400000).toISOString(), status: 'success' as const },
];

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team] = useState(mockTeam);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/teams')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-muted-foreground">{team.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" /> Add Member
          </Button>
          <Button variant="outline" size="sm">
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
              <span className="text-lg font-semibold">{team.members.length}</span>
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
              <span className="text-lg font-semibold">{team.agents.length}</span>
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex -space-x-2 mb-4">
                {team.members.slice(0, 5).map((member) => (
                  <Avatar key={member.id} className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {team.members.length > 5 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                    +{team.members.length - 5}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{team.members.length} members · {team.agents.length} agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {team.agents.slice(0, 3).map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'success' : 'warning'} className="text-[10px]">
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed activities={mockActivity} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage who has access to this team.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.members.map((member) => (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <span className="sr-only">Remove</span>
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
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
                {team.agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{truncate(agent.description, 80)}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{agent.role}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.status === 'active' ? 'success' : 'warning'}>
                        {agent.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              <ActivityFeed activities={mockActivity} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
