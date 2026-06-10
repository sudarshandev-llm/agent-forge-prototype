'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { apiClient } from '@/lib/api-client';
import { formatNumber } from '@/lib/utils';
import { Bot, Play, Users, Activity, ArrowUpRight, Zap, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  stats: {
    totalAgents: number;
    activeAgents: number;
    totalExecutions: number;
    totalTeams: number;
    usagePercent: number;
    avgResponseTime: number;
  };
  activity: Array<{
    id: string;
    type: 'agent_created' | 'agent_executed' | 'team_updated' | 'workflow_run' | 'settings_changed' | 'error' | 'success';
    user: { name: string; avatar?: string };
    description: string;
    timestamp: string;
    status?: 'success' | 'failed' | 'pending';
  }>;
  usageData: Array<{
    date: string;
    executions: number;
    tokens: number;
  }>;
}

const defaultData: DashboardData = {
  stats: {
    totalAgents: 0,
    activeAgents: 0,
    totalExecutions: 0,
    totalTeams: 0,
    usagePercent: 0,
    avgResponseTime: 0,
  },
  activity: [],
  usageData: [],
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, activityRes, usageRes] = await Promise.all([
          apiClient.analytics.system(),
          apiClient.get('/activity?limit=10'),
          apiClient.analytics.usage({ period: '7d' }),
        ]);

        setData({
          stats: statsRes.data as DashboardData['stats'],
          activity: activityRes.data as DashboardData['activity'],
          usageData: usageRes.data as DashboardData['usageData'],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Failed to load dashboard</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const { stats, activity, usageData } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your agents and platform usage.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Agents"
          value={formatNumber(stats.totalAgents)}
          description={`${stats.activeAgents} active`}
          icon={Bot}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Executions"
          value={formatNumber(stats.totalExecutions)}
          description="Total runs"
          icon={Play}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Teams"
          value={formatNumber(stats.totalTeams)}
          description="Active teams"
          icon={Users}
          trend={{ value: 3, isPositive: true }}
        />
        <StatsCard
          title="Avg Response"
          value={`${stats.avgResponseTime}ms`}
          description="Response time"
          icon={Zap}
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Usage (Last 7 Days)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="executions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tokens" fill="hsl(var(--primary)/0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
