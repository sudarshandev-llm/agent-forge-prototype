export enum WorkflowTriggerType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  EVENT = 'event',
  WEBHOOK = 'webhook',
}

export enum WorkflowNodeType {
  START = 'start',
  END = 'end',
  AGENT_EXECUTION = 'agent_execution',
  TOOL_EXECUTION = 'tool_execution',
  CONDITION = 'condition',
  DELAY = 'delay',
  LOOP = 'loop',
  SUB_WORKFLOW = 'sub_workflow',
  NOTIFICATION = 'notification',
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export interface IWorkflowNode {
  id: string;
  workflowId: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface IWorkflowEdge {
  id: string;
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  condition: string | null;
  label: string | null;
}

export interface IWorkflow {
  id: string;
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  triggerConfig: Record<string, unknown>;
  status: WorkflowStatus;
  ownerId: string;
  teamId: string | null;
  version: number;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ICreateWorkflowDTO {
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerConfig?: Record<string, unknown>;
  nodes?: Omit<IWorkflowNode, 'id' | 'workflowId'>[];
  edges?: Omit<IWorkflowEdge, 'id' | 'workflowId'>[];
}

export interface IUpdateWorkflowDTO extends Partial<ICreateWorkflowDTO> {
  status?: WorkflowStatus;
}
