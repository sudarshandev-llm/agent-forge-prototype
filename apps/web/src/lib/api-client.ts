const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'An error occurred',
        response.status,
        data.error?.code,
        data.error?.details,
      );
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${query}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // API methods
  agents = {
    list: (params?: Record<string, string>) => this.get('/agents', params),
    get: (id: string) => this.get(`/agents/${id}`),
    create: (data: unknown) => this.post('/agents', data),
    update: (id: string, data: unknown) => this.put(`/agents/${id}`, data),
    delete: (id: string) => this.delete(`/agents/${id}`),
    execute: (id: string, input: unknown) => this.post(`/agents/${id}/execute`, input),
    fork: (id: string, name?: string) => this.post(`/agents/${id}/fork`, { name }),
  };

  teams = {
    list: () => this.get('/teams'),
    get: (id: string) => this.get(`/teams/${id}`),
    create: (data: unknown) => this.post('/teams', data),
    update: (id: string, data: unknown) => this.put(`/teams/${id}`, data),
    delete: (id: string) => this.delete(`/teams/${id}`),
    addMember: (id: string, data: unknown) => this.post(`/teams/${id}/members`, data),
    removeMember: (id: string, userId: string) => this.delete(`/teams/${id}/members/${userId}`),
  };

  tools = {
    list: (params?: Record<string, string>) => this.get('/tools', params),
    get: (id: string) => this.get(`/tools/${id}`),
    create: (data: unknown) => this.post('/tools', data),
    update: (id: string, data: unknown) => this.put(`/tools/${id}`, data),
    delete: (id: string) => this.delete(`/tools/${id}`),
    execute: (id: string, parameters: unknown) => this.post(`/tools/${id}/execute`, { parameters }),
  };

  workflows = {
    list: () => this.get('/workflows'),
    get: (id: string) => this.get(`/workflows/${id}`),
    create: (data: unknown) => this.post('/workflows', data),
    update: (id: string, data: unknown) => this.put(`/workflows/${id}`, data),
    delete: (id: string) => this.delete(`/workflows/${id}`),
    run: (id: string, input?: unknown) => this.post(`/workflows/${id}/run`, { input }),
  };

  marketplace = {
    list: (params?: Record<string, string>) => this.get('/marketplace', params),
    get: (id: string) => this.get(`/marketplace/${id}`),
    create: (data: unknown) => this.post('/marketplace', data),
  };

  analytics = {
    agents: (agentId: string) => this.get(`/analytics/agents/${agentId}`),
    system: () => this.get('/analytics/system'),
    usage: (params?: Record<string, string>) => this.get('/analytics/usage', params),
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient(API_URL);
