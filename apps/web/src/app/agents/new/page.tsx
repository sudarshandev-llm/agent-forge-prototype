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
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ModelSelector } from '@/components/model-selector';
import { ToolSelector } from '@/components/tool-selector';
import { useUIStore } from '@/store/ui-store';
import { Loader2, ArrowLeft, ArrowRight, Check, Bot, Brain, Wrench, Database } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  role: z.string().min(1, 'Role is required'),
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(256).max(8192),
  systemPrompt: z.string().default(''),
  tools: z.array(z.string()).default([]),
  memoryType: z.enum(['conversation', 'vector', 'both']),
  maxMessages: z.number().min(1).max(200),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { title: 'Basic Info', icon: Bot, description: 'Name, description, and role' },
  { title: 'Model Config', icon: Brain, description: 'Model selection and parameters' },
  { title: 'Tools', icon: Wrench, description: 'Select agent capabilities' },
  { title: 'Memory', icon: Database, description: 'Configure memory settings' },
  { title: 'Review', icon: Check, description: 'Review and create' },
];

const defaultValues: FormData = {
  name: '',
  description: '',
  role: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '',
  tools: [],
  memoryType: 'conversation',
  maxMessages: 50,
};

export default function NewAgentPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const name = watch('name');
  const description = watch('description');
  const model = watch('model');
  const temperature = watch('temperature');
  const maxTokens = watch('maxTokens');
  const tools = watch('tools');
  const memoryType = watch('memoryType');
  const maxMessages = watch('maxMessages');

  const canProceed = () => {
    if (step === 0) return name.trim() && description.trim();
    if (step === 1) return !!model;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      addToast('Agent created successfully', 'success');
      router.push('/agents');
    } catch {
      addToast('Failed to create agent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Give your agent a name, description, and role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input id="name" placeholder="My AI Agent" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A helpful agent that can assist with..."
                  className="min-h-[100px]"
                  {...register('description')}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('role')}
                >
                  <option value="">Select a role...</option>
                  <option value="assistant">Assistant</option>
                  <option value="analyst">Analyst</option>
                  <option value="researcher">Researcher</option>
                  <option value="coder">Coder</option>
                  <option value="writer">Writer</option>
                  <option value="support">Support Agent</option>
                </select>
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
              </div>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>Choose the LLM model and configure parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <ModelSelector value={model} onChange={(v) => setValue('model', v)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature: {temperature.toFixed(1)}</Label>
                  <span className="text-xs text-muted-foreground">
                    {temperature < 0.5 ? 'Precise' : temperature > 1.2 ? 'Creative' : 'Balanced'}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={2}
                  step={0.1}
                  value={[temperature]}
                  onValueChange={([v]) => setValue('temperature', v)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Tokens: {maxTokens}</Label>
                </div>
                <Slider
                  min={256}
                  max={8192}
                  step={256}
                  value={[maxTokens]}
                  onValueChange={([v]) => setValue('maxTokens', v)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="You are a helpful AI assistant that..."
                  className="min-h-[150px] font-mono text-sm"
                  {...register('systemPrompt')}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <ToolSelector
            value={tools}
            onChange={(v) => setValue('tools', v)}
          />
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Memory Configuration</CardTitle>
              <CardDescription>Configure how your agent remembers context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Memory Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={memoryType}
                  onChange={(e) => setValue('memoryType', e.target.value as FormData['memoryType'])}
                >
                  <option value="conversation">Conversation Buffer</option>
                  <option value="vector">Vector Store</option>
                  <option value="both">Both (Buffer + Vector)</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Messages: {maxMessages}</Label>
                </div>
                <Slider
                  min={1}
                  max={200}
                  step={1}
                  value={[maxMessages]}
                  onValueChange={([v]) => setValue('maxMessages', v)}
                />
              </div>
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">About Memory Types</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Conversation:</strong> Stores recent messages in a buffer</li>
                  <li><strong>Vector:</strong> Uses embeddings for semantic retrieval</li>
                  <li><strong>Both:</strong> Combines buffer for recent context + vector for long-term memory</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>Review your agent configuration before creating.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
                  <p className="font-medium">{name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Model</p>
                  <p className="font-medium">{model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Temperature</p>
                  <p className="font-medium">{temperature}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Tokens</p>
                  <p className="font-medium">{maxTokens}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Memory Type</p>
                  <p className="font-medium capitalize">{memoryType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tools</p>
                  <p className="font-medium">{tools.length} selected</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Description</p>
                <p className="text-sm">{description}</p>
              </div>
              {tools.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Selected Tools</p>
                    <div className="flex flex-wrap gap-2">
                      {tools.map((tool) => (
                        <Badge key={tool} variant="secondary">{tool}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
        <p className="text-muted-foreground">Configure your AI agent step by step.</p>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                i === step
                  ? 'text-primary'
                  : i < step
                    ? 'text-primary/60 cursor-pointer hover:text-primary'
                    : 'text-muted-foreground'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  i === step
                    ? 'border-primary bg-primary/10'
                    : i < step
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-muted-foreground/30'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.title}</span>
            </button>
          );
        })}
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)}>
        {renderStep()}

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {steps.length}
          </p>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Create Agent
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
