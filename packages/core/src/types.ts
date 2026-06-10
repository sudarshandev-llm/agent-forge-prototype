export type AgentRole = 'leader' | 'researcher' | 'executor' | 'reviewer';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'google' | 'groq';
  temperature: number;
  maxTokens: number;
  memory?: MemoryConfig;
  tools?: string[];
  role?: AgentRole;
}

export interface MemoryConfig {
  type: 'conversation' | 'vector' | 'both';
  maxMessages?: number;
  ttl?: number;
  vectorDb?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'error';
}

export interface ExecutionStep {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'result';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AgentRunResult {
  id: string;
  agentId: string;
  output: string;
  steps: ExecutionStep[];
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  duration: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}
