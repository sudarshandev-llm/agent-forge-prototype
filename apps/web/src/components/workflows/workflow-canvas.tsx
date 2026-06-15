'use client';

import { useState, useCallback, type DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkflowNode, type WorkflowNodeData } from './workflow-node';
import { Plus } from 'lucide-react';

interface WorkflowCanvasProps {
  nodes: WorkflowNodeData[];
  onNodesChange: (nodes: WorkflowNodeData[]) => void;
  onNodeSelect?: (id: string | null) => void;
  className?: string;
}

export function WorkflowCanvas({
  nodes,
  onNodesChange,
  onNodeSelect,
  className,
}: WorkflowCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      onNodeSelect?.(id);
    },
    [onNodeSelect],
  );

  const handleDelete = useCallback(
    (id: string) => {
      onNodesChange(nodes.filter((n) => n.id !== id));
      if (selectedId === id) handleSelect(null);
    },
    [nodes, selectedId, onNodesChange, handleSelect],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const newNode: WorkflowNodeData = {
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: data.type,
          label: data.label,
          description: `New ${data.type} node`,
        };
        onNodesChange([...nodes, newNode]);
      } catch {
        // invalid drop data
      }
    },
    [nodes, onNodesChange],
  );

  const handleCanvasClick = useCallback(() => {
    handleSelect(null);
  }, [handleSelect]);

  return (
    <div
      className={cn(
        'relative flex-1 rounded-lg border bg-background',
        isDragOver && 'border-primary border-dashed bg-primary/5',
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleCanvasClick}
    >
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center gap-3 p-6 min-h-[400px]">
          {nodes.length === 0 && !isDragOver && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Empty workflow</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Drag nodes from the palette on the left, or click below to add your first step.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  onNodesChange([
                    ...nodes,
                    {
                      id: `node-${Date.now()}`,
                      type: 'start',
                      label: 'Start',
                      description: 'Workflow trigger',
                    },
                  ])
                }
              >
                Add Start Node
              </Button>
            </div>
          )}

          {nodes.map((node) => (
            <div key={node.id} className="w-full max-w-md">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <WorkflowNode
                  data={node}
                  selected={selectedId === node.id}
                  onSelect={() => handleSelect(node.id)}
                  onDelete={() => handleDelete(node.id)}
                />
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
