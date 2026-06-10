import type { ToolDefinition } from '../types.js';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerBuiltIn();
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async execute(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in registry`);
    }
    return tool.execute(params);
  }

  private registerBuiltIn(): void {
    this.register({
      name: 'web_search',
      description: 'Search the web for information on a given query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
        },
        required: ['query'],
      },
      async execute(params: Record<string, unknown>) {
        const query = params.query as string;
        console.log(`[web_search] Searching for: ${query}`);
        return {
          success: true,
          query,
          results: [`Simulated search result for "${query}" - result 1`, `Simulated search result for "${query}" - result 2`],
        };
      },
    });

    this.register({
      name: 'code_runner',
      description: 'Execute a code snippet and return the result',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string', description: 'Programming language' },
          code: { type: 'string', description: 'Code to execute' },
        },
        required: ['language', 'code'],
      },
      async execute(params: Record<string, unknown>) {
        const language = params.language as string;
        const code = params.code as string;
        console.log(`[code_runner] Running ${language} code:\n${code}`);
        return {
          success: true,
          language,
          output: `Simulated output of ${language} code execution`,
        };
      },
    });

    this.register({
      name: 'http_request',
      description: 'Make an HTTP request to a given URL',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Request URL' },
          method: { type: 'string', description: 'HTTP method', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
          body: { type: 'string', description: 'Request body (optional)' },
        },
        required: ['url', 'method'],
      },
      async execute(params: Record<string, unknown>) {
        const url = params.url as string;
        const method = params.method as string;
        console.log(`[http_request] ${method} ${url}`);
        return {
          success: true,
          url,
          method,
          statusCode: 200,
          body: `Simulated response from ${url}`,
        };
      },
    });
  }
}
