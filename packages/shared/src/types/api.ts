export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
}

export interface WebSocketMessage {
  type: string;
  channel: string;
  payload: unknown;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    database: boolean;
    redis: boolean;
    queue: boolean;
    llm: boolean;
  };
}
