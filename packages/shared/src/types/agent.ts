import { MemoryType } from './memory';

export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error',
  DISABLED = 'disabled',
}

export enum AgentCapability {
  CODE_GENERATION = 'code_generation',
  DATA_ANALYSIS = 'data_analysis',
  WEB_SEARCH = 'web_search',
  BROWSER_AUTOMATION = 'browser_automation',
  FILE_OPERATIONS = 'file_operations',
  API_INTEGRATION = 'api_integration',
  NATURAL_LANGUAGE = 'natural_language',
  IMAGE_GENERATION = 'image_generation',
  CUSTOM = 'custom',
}

export interface IAgentConfig {
  model: string;
  provider: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  systemPrompt: string;
  memoryEnabled: boolean;
  maxRetries: number;
  timeout: number;
}

export interface IAgentMemory {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IAgent {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  status: AgentStatus;
  capabilities: AgentCapability[];
  config: IAgentConfig;
  teamId: string | null;
  ownerId: string;
  isTemplate: boolean;
  isPublic: boolean;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ICreateAgentDTO {
  name: string;
  description: string;
  capabilities: AgentCapability[];
  config: Partial<IAgentConfig>;
  avatarUrl?: string;
  teamId?: string;
  isPublic?: boolean;
}

export interface IUpdateAgentDTO extends Partial<ICreateAgentDTO> {
  status?: AgentStatus;
}
