export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum ExecutionType {
  AGENT = 'agent',
  WORKFLOW = 'workflow',
  TOOL = 'tool',
}

export interface IExecution {
  id: string;
  type: ExecutionType;
  status: ExecutionStatus;
  trigger: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  duration: number | null;
  tokenUsage: TokenUsage | null;
  cost: number | null;
  ownerId: string;
  agentId: string | null;
  workflowId: string | null;
  workflowRunId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface IExecutionLog {
  id: string;
  executionId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  data: Record<string, unknown> | null;
  timestamp: string;
}

export interface IWorkflowRun {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  trigger: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  currentNodeId: string | null;
  nodeResults: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
}
