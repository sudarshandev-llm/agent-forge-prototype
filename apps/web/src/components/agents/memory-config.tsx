'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Database, History, RefreshCw } from 'lucide-react';

interface MemoryConfigValues {
  type: 'none' | 'conversation' | 'summary' | 'hybrid';
  maxMessages: number;
  maxTokens: number;
  summarizeThreshold: number;
  vectorSearch: boolean;
  similarityTopK: number;
  sessionTimeout: number;
  persistToDisk: boolean;
}

interface MemoryConfigProps {
  values: MemoryConfigValues;
  onChange: (values: MemoryConfigValues) => void;
  errors?: Partial<Record<keyof MemoryConfigValues, string>>;
}

export function MemoryConfig({ values, onChange, errors }: MemoryConfigProps) {
  const update = (key: keyof MemoryConfigValues, value: string | number | boolean) => {
    onChange({ ...values, [key]: value as never });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Memory Configuration
          </CardTitle>
          <CardDescription>
            Configure how your agent remembers and uses context from previous interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Memory Type</Label>
            <Select value={values.type} onValueChange={(v) => update('type', v as MemoryConfigValues['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="conversation">Conversation Buffer</SelectItem>
                <SelectItem value="summary">Summarized Memory</SelectItem>
                <SelectItem value="hybrid">Hybrid (Buffer + Summary)</SelectItem>
              </SelectContent>
            </Select>
            {errors?.type && <p className="text-sm text-destructive">{errors.type}</p>}
          </div>

          {values.type !== 'none' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <History className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label>Message History</Label>
                      <p className="text-sm text-muted-foreground">Maximum recent messages to retain</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20 h-9 text-center"
                      min={1}
                      max={200}
                      value={values.maxMessages}
                      onChange={(e) => update('maxMessages', parseInt(e.target.value) || 10)}
                    />
                  </div>
                </div>
                {errors?.maxMessages && <p className="text-sm text-destructive">{errors.maxMessages}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Memory Token Limit: {values.maxTokens}</Label>
                </div>
                <Slider
                  min={512}
                  max={16384}
                  step={512}
                  value={[values.maxTokens]}
                  onValueChange={([v]) => update('maxTokens', v)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum tokens allocated for memory context.
                </p>
                {errors?.maxTokens && <p className="text-sm text-destructive">{errors.maxTokens}</p>}
              </div>

              {(values.type === 'summary' || values.type === 'hybrid') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Summarize After Messages: {values.summarizeThreshold}</Label>
                  </div>
                  <Slider
                    min={5}
                    max={100}
                    step={5}
                    value={[values.summarizeThreshold]}
                    onValueChange={([v]) => update('summarizeThreshold', v)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Triggers summarization after this many messages.
                  </p>
                  {errors?.summarizeThreshold && <p className="text-sm text-destructive">{errors.summarizeThreshold}</p>}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Vector Search</Label>
                    <p className="text-sm text-muted-foreground">Enable semantic similarity search</p>
                  </div>
                </div>
                <Switch
                  checked={values.vectorSearch}
                  onCheckedChange={(checked) => update('vectorSearch', checked)}
                />
              </div>

              {values.vectorSearch && (
                <div className="space-y-2 pl-8">
                  <div className="flex items-center justify-between">
                    <Label>Top K Results: {values.similarityTopK}</Label>
                  </div>
                  <Slider
                    min={1}
                    max={20}
                    step={1}
                    value={[values.similarityTopK]}
                    onValueChange={([v]) => update('similarityTopK', v)}
                  />
                  {errors?.similarityTopK && <p className="text-sm text-destructive">{errors.similarityTopK}</p>}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <RefreshCw className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <p className="text-sm text-muted-foreground">Clear memory after inactivity</p>
                  </div>
                </div>
                <Input
                  type="number"
                  className="w-20 h-9 text-center"
                  min={1}
                  max={1440}
                  value={values.sessionTimeout}
                  onChange={(e) => update('sessionTimeout', parseInt(e.target.value) || 30)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Database className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label>Persist to Disk</Label>
                    <p className="text-sm text-muted-foreground">Save memory state between sessions</p>
                  </div>
                </div>
                <Switch
                  checked={values.persistToDisk}
                  onCheckedChange={(checked) => update('persistToDisk', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
