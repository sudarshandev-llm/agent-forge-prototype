'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Search,
  Check,
  Wrench,
  Globe,
  Database,
  FileText,
  Image,
  Code,
  MessageSquare,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface ToolSelectorProps {
  tools: Tool[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

const categoryIcons: Record<string, typeof Wrench> = {
  web: Globe,
  data: Database,
  document: FileText,
  image: Image,
  code: Code,
  communication: MessageSquare,
  utility: Wrench,
};

const categoryColors: Record<string, string> = {
  web: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  data: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  document: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  image: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  code: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300',
  communication: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
  utility: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300',
};

export function ToolSelector({ tools, selectedIds, onChange }: ToolSelectorProps) {
  const [search, setSearch] = useState('');

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );

  const categories = [...new Set(filtered.map((t) => t.category))];

  const toggleTool = (toolId: string) => {
    if (selectedIds.includes(toolId)) {
      onChange(selectedIds.filter((id) => id !== toolId));
    } else {
      onChange([...selectedIds, toolId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {categories.map((category) => {
            const categoryTools = filtered.filter((t) => t.category === category);
            const Icon = categoryIcons[category] || Wrench;

            return (
              <div key={category} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium capitalize">{category}</h4>
                  <span className="text-xs text-muted-foreground">
                    {categoryTools.filter((t) => selectedIds.includes(t.id)).length}/
                    {categoryTools.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {categoryTools.map((tool) => {
                    const isSelected = selectedIds.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => toggleTool(tool.id)}
                        disabled={!tool.enabled}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md border p-2.5 text-left text-sm transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent hover:bg-muted',
                          !tool.enabled && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md border',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted',
                          )}
                        >
                          {isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{tool.name}</span>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5 py-0', categoryColors[category])}
                            >
                              {category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {tool.description}
                          </p>
                        </div>
                        {!tool.enabled && (
                          <Badge variant="outline" className="text-[10px]">
                            Coming Soon
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No tools found
            </div>
          )}
        </ScrollArea>
        <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            {selectedIds.length} of {tools.length} tools selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange(selectedIds.length === tools.length ? [] : tools.map((t) => t.id))
            }
          >
            {selectedIds.length === tools.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
