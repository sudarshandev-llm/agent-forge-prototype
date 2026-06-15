'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WorkflowCanvas } from '@/components/workflows/workflow-canvas';
import { NodePalette } from '@/components/workflows/node-palette';
import { type WorkflowNodeData } from '@/components/workflows/workflow-node';
import {
  ArrowLeft,
  Play,
  Save,
  Settings,
  Clock,
  Trash2,
  Globe,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const initialNodes: WorkflowNodeData[] = [
  {
    id: 'node-1',
    type: 'start',
    label: 'Start',
    description: 'Webhook trigger',
  },
  {
    id: 'node-2',
    type: 'agentAction',
    label: 'Analyze Input',
    description: 'Process incoming data',
  },
  {
    id: 'node-3',
    type: 'condition',
    label: 'Valid Data?',
    description: 'Check input validity',
  },
  {
    id: 'node-4',
    type: 'toolCall',
    label: 'Save to Database',
    description: 'Persist results',
  },
  {
    id: 'node-5',
    type: 'end',
    label: 'End',
    description: 'Workflow complete',
  },
];

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [nodes, setNodes] = useState<WorkflowNodeData[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const handleRun = async () => {
    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsRunning(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/workflows">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Customer Onboarding</h1>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Automated onboarding with verification</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" className="gap-2" onClick={handleRun} disabled={isRunning}>
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Clock className="h-4 w-4" /> Run History
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Globe className="h-4 w-4" /> Webhook URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r bg-muted/30 lg:block">
          <div className="p-4">
            <NodePalette />
          </div>
        </aside>

        <WorkflowCanvas nodes={nodes} onNodesChange={setNodes} onNodeSelect={setSelectedNode} />

        {selectedNodeData && (
          <aside className="hidden w-80 shrink-0 border-l bg-muted/30 lg:block">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Node Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedNode(null)}
                >
                  <ArrowLeft className="h-3 w-3" />
                </Button>
              </div>

              <Separator />

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <p className="text-sm capitalize">
                  {selectedNodeData.type.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Label</label>
                <p className="text-sm">{selectedNodeData.label}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <p className="text-sm text-muted-foreground">{selectedNodeData.description}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Configuration</h4>
                <div className="rounded-md border bg-background p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Select a node to configure its properties.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
