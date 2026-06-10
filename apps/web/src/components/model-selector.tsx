'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Sparkles, Brain, Atom, Cpu } from 'lucide-react';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface ModelGroup {
  provider: string;
  icon: typeof Sparkles;
  color: string;
  models: { id: string; name: string }[];
}

const modelGroups: ModelGroup[] = [
  {
    provider: 'OpenAI',
    icon: Sparkles,
    color: 'text-green-500',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
  },
  {
    provider: 'Anthropic',
    icon: Brain,
    color: 'text-orange-500',
    models: [
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    ],
  },
  {
    provider: 'Google',
    icon: Atom,
    color: 'text-blue-500',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
  },
  {
    provider: 'Groq',
    icon: Cpu,
    color: 'text-purple-500',
    models: [
      { id: 'llama-3-70b', name: 'Llama 3 70B' },
      { id: 'mixtral-8x7b', name: 'Mixtral 8x7B' },
    ],
  },
];

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {modelGroups.map((group) => {
          const Icon = group.icon;
          return (
            <SelectGroup key={group.provider}>
              <SelectLabel className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', group.color)} />
                {group.provider}
              </SelectLabel>
              {group.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="flex items-center gap-2">
                    <Icon className={cn('h-3.5 w-3.5', group.color)} />
                    {model.name}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
