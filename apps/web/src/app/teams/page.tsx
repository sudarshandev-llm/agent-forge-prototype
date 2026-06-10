'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getInitials } from '@/lib/utils';
import { Plus, Search, Users, UserPlus, MoreHorizontal, Trash2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  agentCount: number;
  members: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

const mockTeams: Team[] = [
  { id: '1', name: 'Engineering', description: 'Core engineering team building agent infrastructure.', memberCount: 5, agentCount: 3, members: [{ id: 'u1', name: 'Alice Chen' }, { id: 'u2', name: 'Bob Smith' }, { id: 'u3', name: 'Carol Davis' }], createdAt: '2024-01-15', updatedAt: '2024-06-01' },
  { id: '2', name: 'Customer Success', description: 'Handling customer inquiries with AI agents.', memberCount: 4, agentCount: 6, members: [{ id: 'u4', name: 'David Lee' }, { id: 'u5', name: 'Eve Wilson' }], createdAt: '2024-02-20', updatedAt: '2024-06-05' },
  { id: '3', name: 'Data Science', description: 'Data analysis and ML model management.', memberCount: 3, agentCount: 4, members: [{ id: 'u6', name: 'Frank Brown' }], createdAt: '2024-03-10', updatedAt: '2024-05-28' },
  { id: '4', name: 'Operations', description: 'Automating operational workflows.', memberCount: 6, agentCount: 2, members: [{ id: 'u7', name: 'Grace Kim' }, { id: 'u8', name: 'Henry Patel' }], createdAt: '2024-04-01', updatedAt: '2024-06-08' },
];

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [teams] = useState<Team[]>(mockTeams);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()),
    );
  }, [teams, search]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Organize agents into collaborative teams.</p>
        </div>
        <Link href="/teams/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex -space-x-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No teams found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Create your first team to get started'}
            </p>
            {!search && (
              <Link href="/teams/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Create Team
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {team.memberCount} members
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{team.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {team.memberCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4" />
                        {team.agentCount} agents
                      </span>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 5).map((member) => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {team.memberCount > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                        +{team.memberCount - 5}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated {formatDate(team.updatedAt, 'relative')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
