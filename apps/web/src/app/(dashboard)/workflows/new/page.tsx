'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ArrowLeft, Workflow } from 'lucide-react';
import Link from 'next/link';

const workflowSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  trigger: z.string().min(1, 'Please select a trigger type'),
});

type WorkflowForm = z.infer<typeof workflowSchema>;

const triggers = [
  { value: 'manual', label: 'Manual Trigger', description: 'Run the workflow on demand' },
  { value: 'schedule', label: 'Schedule', description: 'Run on a cron schedule' },
  { value: 'webhook', label: 'Webhook', description: 'Trigger via HTTP webhook' },
  { value: 'event', label: 'Event', description: 'React to system events' },
];

const templates = [
  {
    id: 'blank',
    name: 'Blank Workflow',
    description: 'Start from scratch',
    icon: Workflow,
    nodes: 0,
  },
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding',
    description: 'Welcome emails, account setup, and verification',
    nodes: 8,
  },
  {
    id: 'content-review',
    name: 'Content Review Pipeline',
    description: 'AI analysis with human approval gates',
    nodes: 12,
  },
  {
    id: 'data-sync',
    name: 'Data Sync',
    description: 'Sync data across platforms',
    nodes: 5,
  },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WorkflowForm>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: '',
      description: '',
      trigger: 'manual',
    },
  });

  const onSubmit = async (data: WorkflowForm) => {
    setIsCreating(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success('Workflow created successfully!');
      router.push('/workflows/1');
    } catch {
      toast.error('Failed to create workflow');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/workflows" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create Workflow</h1>
        <p className="text-muted-foreground">
          Start with a template or build from scratch.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((template) => {
          const Icon = template.icon;
          const selected = selectedTemplate === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                setSelectedTemplate(template.id);
                if (template.id !== 'blank') {
                  setValue('name', template.name);
                  setValue('description', template.description);
                }
              }}
              className="text-left"
            >
              <Card
                className={cn(
                  'h-full cursor-pointer transition-all hover:shadow-md',
                  selected ? 'ring-2 ring-primary border-primary' : '',
                )}
              >
                <CardContent className="p-4">
                  <div className="rounded-lg bg-muted p-3 w-fit mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {template.nodes} nodes
                  </p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
            <CardDescription>Configure your workflow settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Customer Onboarding"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe what this workflow does..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger Type</Label>
              <Select
                onValueChange={(v) => setValue('trigger', v)}
                defaultValue="manual"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {triggers.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <span>{t.label}</span>
                        <span className="text-muted-foreground ml-2">- {t.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.trigger && (
                <p className="text-sm text-destructive">{errors.trigger.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Workflow'}
          </Button>
        </div>
      </form>
    </div>
  );
}
