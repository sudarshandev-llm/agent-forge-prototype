export enum MemoryType {
  CONVERSATION = 'conversation',
  KNOWLEDGE = 'knowledge',
  EXPERIENCE = 'experience',
  PREFERENCE = 'preference',
  CONTEXT = 'context',
  CUSTOM = 'custom',
}

export interface IMemory {
  id: string;
  agentId: string;
  type: MemoryType;
  key: string;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  importance: number;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface IMemorySearch {
  query: string;
  agentId: string;
  types?: MemoryType[];
  limit?: number;
  minImportance?: number;
  threshold?: number;
}

export interface IMemorySearchResult {
  memory: IMemory;
  score: number;
}

export interface ICreateMemoryDTO {
  agentId: string;
  type: MemoryType;
  key: string;
  content: string;
  metadata?: Record<string, unknown>;
  importance?: number;
  expiresAt?: string;
}

export interface IUpdateMemoryDTO extends Partial<ICreateMemoryDTO> {
  accessCount?: number;
}
