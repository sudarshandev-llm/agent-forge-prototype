'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, Play, Users, Activity, Plus, Workflow, Store, ArrowUpRight } from 'lucide-react';

const mockStats = {
  activeAgents: 12,
  totalExecutions: 8453,
  teamMembers: 8,
  apiCalls: 12450,
};

const mockActivity = [
  {
    id: '1',
    type: 'agent_executed' as const,
    user: { name: 'Alice Chen' },
    description: 'Ran Customer Support Agent for ticket #1234',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    status: 'success' as const,
  },
  {
    id: '2',
    type: 'agent_created' as const,
    user: { name: 'Bob Smith' },
    description: 'Created new Data Analyst agent',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'success' as const,
  },
  {
    id: '3',
    type: 'workflow_run' as const,
    user: { name: 'Carol Davis' },
    description: 'Content Review Pipeline completed',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'success' as const,
  },
  {
    id: '4',
    type: 'team_updated' as const,
    user: { name: 'David Lee' },
    description: 'Added 2 members to Engineering team',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '5',
    type: 'error' as const,
    user: { name: 'Eve Wilson' },
    description: 'Web Scraper agent failed - rate limit exceeded',
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    status: 'failed' as const,
  },
];

const usageData = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    date: date.toISOString(),
    executions: Math.floor(Math.random() * 80) + 20,
    tokens: Math.floor(Math.random() * 50000) + 10000,
  };
});

export default function DashboardPage() {
  const [stats] = useState(mockStats);
  const [activity] = useState(mockActivity);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your agents and platform usage.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Agents"
          value={stats.activeAgents}
          description="Running in production"
          icon={Bot}
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title="Total Executions"
          value={stats.totalExecutions.toLocaleString()}
          description="All time"
          icon={Play}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Team Members"
          value={stats.teamMembers}
          description="Across all teams"
          icon={Users}
          trend={{ value: 0, isPositive: true }}
        />
        <StatsCard
          title="API Calls"
          value={stats.apiCalls.toLocaleString()}
          description="Last 30 days"
          icon={Activity}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/agents/new">
          <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Create Agent</h3>
              <p className="text-sm text-muted-foreground mt-1">Build a new AI agent</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/workflows/new">
          <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3 group-hover:bg-primary/20 transition-colors">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">New Workflow</h3>
              <p className="text-sm text-muted-foreground mt-1">Design an automation flow</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/marketplace">
          <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3 group-hover:bg-primary/20 transition-colors">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Browse Marketplace</h3>
              <p className="text-sm text-muted-foreground mt-1">Discover pre-built solutions</p>
            </CardContent>
          </Card>
        </Link>
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
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('en-US', { weekday: 'short' })
                    }
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="executions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
