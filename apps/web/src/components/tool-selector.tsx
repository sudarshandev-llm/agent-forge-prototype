'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Globe, Code, FileText, GitBranch, ExternalLink, Search, Check } from 'lucide-react';

interface ToolItem {
  id: string;
  name: string;
  description: string;
}

interface ToolSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

const builtInTools: ToolItem[] = [
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the internet for real-time information',
  },
  {
    id: 'code_runner',
    name: 'Code Runner',
    description: 'Execute Python/JavaScript code in a sandbox',
  },
  { id: 'http_request', name: 'HTTP Request', description: 'Make HTTP requests to external APIs' },
  { id: 'file_system', name: 'File System', description: 'Read and write files in the workspace' },
  { id: 'github', name: 'GitHub', description: 'Interact with GitHub repos, issues, and PRs' },
  { id: 'browser', name: 'Browser', description: 'Render and interact with web pages' },
];

const toolIcons: Record<string, typeof Globe> = {
  web_search: Search,
  code_runner: Code,
  http_request: Globe,
  file_system: FileText,
  github: GitBranch,
  browser: ExternalLink,
};

export function ToolSelector({ value, onChange, className }: ToolSelectorProps) {
  const toggleTool = (toolId: string) => {
    if (value.includes(toolId)) {
      onChange(value.filter((id) => id !== toolId));
    } else {
      onChange([...value, toolId]);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Available Tools</span>
          <Badge variant="secondary">{value.length} selected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {builtInTools.map((tool) => {
            const Icon = toolIcons[tool.id] || Globe;
            const isSelected = value.includes(tool.id);
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => toggleTool(tool.id)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                  isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'bg-muted',
                  )}
                >
                  {isSelected ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tool.name}</span>
                    {isSelected && (
                      <Badge variant="default" className="text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        {builtInTools.length === 0 && (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            No tools available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
