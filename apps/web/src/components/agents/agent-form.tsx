'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AgentConfig } from './agent-config';
import { ToolSelector } from './tool-selector';
import { MemoryConfig } from './memory-config';
import { useUIStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';
import { Loader2, ArrowLeft, ArrowRight, Save, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
  model: z.string().min(1, 'Model is required'),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(256).max(8192),
  topP: z.number().min(0).max(1),
  systemPrompt: z.string().default(''),
  stopSequences: z.string().default(''),
  tools: z.array(z.string()).default([]),
  memory: z.object({
    type: z.enum(['none', 'conversation', 'summary', 'hybrid']),
    maxMessages: z.number().min(1).max(200),
    maxTokens: z.number().min(512).max(16384),
    summarizeThreshold: z.number().min(5).max(100),
    vectorSearch: z.boolean(),
    similarityTopK: z.number().min(1).max(20),
    sessionTimeout: z.number().min(1).max(1440),
    persistToDisk: z.boolean(),
  }),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

const defaultConfig: AgentFormData = {
  name: '',
  description: '',
  capabilities: [],
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  systemPrompt: '',
  stopSequences: '',
  tools: [],
  memory: {
    type: 'conversation',
    maxMessages: 50,
    maxTokens: 4096,
    summarizeThreshold: 20,
    vectorSearch: false,
    similarityTopK: 5,
    sessionTimeout: 30,
    persistToDisk: true,
  },
};

const SAMPLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for information', category: 'web', enabled: true },
  { id: 'web_scrape', name: 'Web Scraper', description: 'Extract content from web pages', category: 'web', enabled: true },
  { id: 'sql_query', name: 'SQL Query', description: 'Execute SQL queries against databases', category: 'data', enabled: true },
  { id: 'file_read', name: 'File Reader', description: 'Read and parse files', category: 'document', enabled: true },
  { id: 'file_write', name: 'File Writer', description: 'Write content to files', category: 'document', enabled: true },
  { id: 'image_gen', name: 'Image Generator', description: 'Generate images from prompts', category: 'image', enabled: true },
  { id: 'code_interpreter', name: 'Code Interpreter', description: 'Execute Python/JavaScript code', category: 'code', enabled: true },
  { id: 'send_email', name: 'Send Email', description: 'Send emails via SMTP', category: 'communication', enabled: true },
  { id: 'slack_message', name: 'Slack Message', description: 'Send messages to Slack channels', category: 'communication', enabled: true },
  { id: 'math', name: 'Math Solver', description: 'Solve mathematical expressions', category: 'utility', enabled: true },
  { id: 'json_transform', name: 'JSON Transformer', description: 'Transform JSON data', category: 'utility', enabled: true },
  { id: 'pdf_parse', name: 'PDF Parser', description: 'Extract text from PDF files', category: 'document', enabled: false },
];

interface AgentFormProps {
  initialData?: Partial<AgentFormData>;
  agentId?: string;
}

export function AgentForm({ initialData, agentId }: AgentFormProps) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCapability, setNewCapability] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: { ...defaultConfig, ...initialData },
  });

  const capabilities = watch('capabilities');
  const tools = watch('tools');
  const configValues = {
    model: watch('model'),
    temperature: watch('temperature'),
    maxTokens: watch('maxTokens'),
    topP: watch('topP'),
    systemPrompt: watch('systemPrompt'),
    stopSequences: watch('stopSequences'),
  };
  const memoryValues = watch('memory');

  const addCapability = () => {
    const trimmed = newCapability.trim();
    if (trimmed && !capabilities.includes(trimmed)) {
      setValue('capabilities', [...capabilities, trimmed]);
      setNewCapability('');
    }
  };

  const removeCapability = (cap: string) => {
    setValue('capabilities', capabilities.filter((c) => c !== cap));
  };

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    try {
      if (agentId) {
        await apiClient.agents.update(agentId, data);
        addToast('Agent updated successfully', 'success');
      } else {
        await apiClient.agents.create(data);
        addToast('Agent created successfully', 'success');
      }
      router.push('/dashboard/agents');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to save agent', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: 'Basic Info', description: 'Name and description' },
    { title: 'Configuration', description: 'Model and parameters' },
    { title: 'Tools & Capabilities', description: 'Select tools and capabilities' },
    { title: 'Memory', description: 'Memory configuration' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {agentId ? 'Edit Agent' : 'Create New Agent'}
          </h2>
          <p className="text-muted-foreground">
            {agentId ? 'Update your agent configuration' : 'Configure your AI agent with tools and memory'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {agentId ? 'Update Agent' : 'Create Agent'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              i === step
                ? 'bg-primary text-primary-foreground'
                : i < step
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-xs">
              {i + 1}
            </span>
            {s.title}
          </button>
        ))}
      </div>

      <Separator />

      {/* Step 1: Basic Info */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Give your agent a name and describe what it does.</CardDescription>
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
                placeholder="A helpful agent that can search the web and answer questions..."
                className="min-h-[100px]"
                {...register('description')}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Capabilities</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary" className="gap-1">
                    {cap}
                    <button type="button" onClick={() => removeCapability(cap)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a capability..."
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCapability())}
                />
                <Button type="button" variant="outline" onClick={addCapability}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.capabilities && <p className="text-sm text-destructive">{errors.capabilities.message}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configuration */}
      {step === 1 && (
        <AgentConfig
          values={configValues}
          onChange={(v) => {
            setValue('model', v.model);
            setValue('temperature', v.temperature);
            setValue('maxTokens', v.maxTokens);
            setValue('topP', v.topP);
            setValue('systemPrompt', v.systemPrompt);
            setValue('stopSequences', v.stopSequences);
          }}
        />
      )}

      {/* Step 3: Tools */}
      {step === 2 && (
        <div className="space-y-6">
          <ToolSelector
            tools={SAMPLE_TOOLS}
            selectedIds={tools}
            onChange={(ids) => setValue('tools', ids)}
          />
        </div>
      )}

      {/* Step 4: Memory */}
      {step === 3 && (
        <MemoryConfig
          values={memoryValues}
          onChange={(v) => setValue('memory', v)}
        />
      )}

      <Separator />

      <div className="flex items-center justify-between">
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
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {agentId ? 'Update Agent' : 'Create Agent'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
