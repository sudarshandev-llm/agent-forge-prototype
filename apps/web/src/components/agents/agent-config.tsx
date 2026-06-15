'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentConfigValues {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  stopSequences: string;
}

interface AgentConfigProps {
  values: AgentConfigValues;
  onChange: (values: AgentConfigValues) => void;
  errors?: Partial<Record<keyof AgentConfigValues, string>>;
}

const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
  { id: 'gemini-pro', name: 'Gemini Pro' },
  { id: 'llama-3-70b', name: 'Llama 3 70B' },
  { id: 'llama-3-8b', name: 'Llama 3 8B' },
  { id: 'mistral-large', name: 'Mistral Large' },
];

export function AgentConfig({ values, onChange, errors }: AgentConfigProps) {
  const update = (key: keyof AgentConfigValues, value: string | number) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <CardDescription>Choose the LLM model and configure its parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={values.model} onValueChange={(v) => update('model', v)}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.model && <p className="text-sm text-destructive">{errors.model}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature: {values.temperature}</Label>
              <span className="text-xs text-muted-foreground">
                {values.temperature < 0.5 ? 'More deterministic' : 'More creative'}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[values.temperature]}
              onValueChange={([v]) => update('temperature', v)}
            />
            {errors?.temperature && (
              <p className="text-sm text-destructive">{errors.temperature}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens">Max Output Tokens: {values.maxTokens}</Label>
            </div>
            <Slider
              id="maxTokens"
              min={256}
              max={8192}
              step={256}
              value={[values.maxTokens]}
              onValueChange={([v]) => update('maxTokens', v)}
            />
            {errors?.maxTokens && <p className="text-sm text-destructive">{errors.maxTokens}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topP">Top P: {values.topP}</Label>
            </div>
            <Slider
              id="topP"
              min={0}
              max={1}
              step={0.05}
              value={[values.topP]}
              onValueChange={([v]) => update('topP', v)}
            />
            {errors?.topP && <p className="text-sm text-destructive">{errors.topP}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
          <CardDescription>Define the system-level instructions for your agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              placeholder="You are a helpful AI assistant that..."
              className="min-h-[200px] font-mono text-sm"
              value={values.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
            />
            {errors?.systemPrompt && (
              <p className="text-sm text-destructive">{errors.systemPrompt}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>Additional configuration options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stopSequences">Stop Sequences (comma-separated)</Label>
            <Input
              id="stopSequences"
              placeholder="---, END, STOP"
              value={values.stopSequences}
              onChange={(e) => update('stopSequences', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Sequences where the model will stop generating further tokens.
            </p>
            {errors?.stopSequences && (
              <p className="text-sm text-destructive">{errors.stopSequences}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
