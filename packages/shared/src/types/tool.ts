export enum ToolType {
  API_CALL = 'api_call',
  CODE_EXECUTION = 'code_execution',
  FILE_OPERATION = 'file_operation',
  WEB_SEARCH = 'web_search',
  BROWSER_AUTOMATION = 'browser_automation',
  DATABASE_QUERY = 'database_query',
  EMAIL = 'email',
  IMAGE_GENERATION = 'image_generation',
  CUSTOM = 'custom',
}

export enum ToolAuthType {
  NONE = 'none',
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC = 'basic',
}

export interface IToolConfig {
  type: ToolType;
  authType: ToolAuthType;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  parameters: IToolParameter[];
  timeout: number;
  maxRetries: number;
}

export interface IToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  defaultValue?: unknown;
  enum?: string[];
}

export interface ITool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  config: IToolConfig;
  category: string;
  ownerId: string;
  isPublic: boolean;
  isBuiltin: boolean;
  version: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ICreateToolDTO {
  name: string;
  description: string;
  type: ToolType;
  config: IToolConfig;
  category?: string;
  isPublic?: boolean;
}

export interface IUpdateToolDTO extends Partial<ICreateToolDTO> {}

export interface IToolExecutionResult {
  success: boolean;
  data: unknown;
  error?: string;
  duration: number;
  output: Record<string, unknown>;
}
