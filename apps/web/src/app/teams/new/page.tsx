'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUIStore } from '@/store/ui-store';
import { getInitials } from '@/lib/utils';
import { Loader2, Check, X, Users, Bot } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  members: z.array(z.string()).min(1, 'Select at least one member'),
  agents: z.array(z.object({ id: z.string(), role: z.string() })),
});

type FormData = z.infer<typeof formSchema>;

const availableUsers = [
  { id: 'u1', name: 'Alice Chen', email: 'alice@example.com' },
  { id: 'u2', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'u3', name: 'Carol Davis', email: 'carol@example.com' },
  { id: 'u4', name: 'David Lee', email: 'david@example.com' },
  { id: 'u5', name: 'Eve Wilson', email: 'eve@example.com' },
];

const availableAgents = [
  { id: 'a1', name: 'Customer Support Agent' },
  { id: 'a2', name: 'Data Analyst' },
  { id: 'a3', name: 'Code Reviewer' },
  { id: 'a4', name: 'Web Scraper' },
];

const roles = ['Member', 'Admin', 'Viewer'];

export default function NewTeamPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', members: [], agents: [] },
  });

  const selectedMembers = watch('members');
  const selectedAgents = watch('agents');

  const toggleMember = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setValue(
        'members',
        selectedMembers.filter((id) => id !== userId),
      );
    } else {
      setValue('members', [...selectedMembers, userId]);
    }
  };

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.find((a) => a.id === agentId)) {
      setValue(
        'agents',
        selectedAgents.filter((a) => a.id !== agentId),
      );
    } else {
      setValue('agents', [...selectedAgents, { id: agentId, role: 'Member' }]);
    }
  };

  const setAgentRole = (agentId: string, role: string) => {
    setValue(
      'agents',
      selectedAgents.map((a) => (a.id === agentId ? { ...a, role } : a)),
    );
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      addToast('Team created successfully', 'success');
      router.push('/teams');
    } catch {
      addToast('Failed to create team', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Team</h1>
        <p className="text-muted-foreground">Set up a new team with members and agents.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
            <CardDescription>Basic information about your team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" placeholder="My Team" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this team do?"
                className="min-h-[80px]"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Members</span>
              <Badge variant="secondary">{selectedMembers.length} selected</Badge>
            </CardTitle>
            <CardDescription>Select team members.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableUsers.map((user) => {
                const isSelected = selectedMembers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleMember(user.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            {errors.members && (
              <p className="text-sm text-destructive mt-2">{errors.members.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Agents</span>
              <Badge variant="secondary">{selectedAgents.length} assigned</Badge>
            </CardTitle>
            <CardDescription>Assign agents to this team with roles.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableAgents.map((agent) => {
                const assigned = selectedAgents.find((a) => a.id === agent.id);
                return (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      assigned ? 'border-primary/50' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAgent(agent.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                        assigned ? 'border-primary bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {assigned ? <Check className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                    </div>
                    {assigned && (
                      <select
                        value={assigned.role}
                        onChange={(e) => setAgentRole(agent.id, e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Team
          </Button>
        </div>
      </form>
    </div>
  );
}
