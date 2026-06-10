import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../config/database.js';
import { toolService } from '../../services/tool.service.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { ToolType } from '@agentforge/shared';

const mockTool = {
  id: 'tool-1',
  name: 'web_search',
  description: 'Search the web',
  type: ToolType.WEB_SEARCH,
  config: { type: 'web_search' },
  category: 'search',
  ownerId: 'user-1',
  isPublic: true,
  isBuiltin: false,
  version: 1,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockApiTool = {
  ...mockTool,
  id: 'tool-2',
  name: 'weather_api',
  type: ToolType.API_CALL,
  config: { type: 'api_call', endpoint: 'https://api.weather.com', method: 'GET', headers: {} },
};

describe('toolService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTool', () => {
    it('should create a tool', async () => {
      vi.mocked(prisma.tool.create).mockResolvedValue(mockTool);

      const result = await toolService.createTool({
        name: 'web_search',
        description: 'Search the web',
        type: ToolType.WEB_SEARCH,
        config: { type: 'web_search' },
        ownerId: 'user-1',
        isPublic: true,
      });

      expect(prisma.tool.create).toHaveBeenCalledWith({
        data: {
          name: 'web_search',
          description: 'Search the web',
          type: ToolType.WEB_SEARCH,
          config: { type: 'web_search' },
          category: 'general',
          ownerId: 'user-1',
          isPublic: true,
          isBuiltin: false,
          version: 1,
        },
      });
      expect(result).toEqual(mockTool);
    });

    it('should use provided category', async () => {
      vi.mocked(prisma.tool.create).mockResolvedValue(mockTool);

      await toolService.createTool({
        name: 'tool',
        description: 'desc',
        type: ToolType.API_CALL,
        config: {},
        category: 'custom-category',
        ownerId: 'user-1',
      });

      expect(prisma.tool.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: 'custom-category' }),
        }),
      );
    });
  });

  describe('getToolById', () => {
    it('should return public tool', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(mockTool);

      const result = await toolService.getToolById('tool-1', 'other-user');

      expect(result).toEqual(mockTool);
    });

    it('should return owned private tool', async () => {
      const privateTool = { ...mockTool, isPublic: false, ownerId: 'user-1' };
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(privateTool);

      const result = await toolService.getToolById('tool-1', 'user-1');

      expect(result).toEqual(privateTool);
    });

    it('should throw 404 when not accessible', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(null);

      await expect(toolService.getToolById('tool-1', 'user-2')).rejects.toThrow(ApiError);
    });
  });

  describe('listTools', () => {
    it('should return paginated tools', async () => {
      vi.mocked(prisma.tool.findMany).mockResolvedValue([mockTool]);
      vi.mocked(prisma.tool.count).mockResolvedValue(1);

      const result = await toolService.listTools({ ownerId: 'user-1' });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by type', async () => {
      vi.mocked(prisma.tool.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tool.count).mockResolvedValue(0);

      await toolService.listTools({ ownerId: 'user-1', type: 'api_call' });

      const call = vi.mocked(prisma.tool.findMany).mock.calls[0]![0] as any;
      expect(call.where.type).toBe('api_call');
    });

    it('should search by name', async () => {
      vi.mocked(prisma.tool.findMany).mockResolvedValue([]);
      vi.mocked(prisma.tool.count).mockResolvedValue(0);

      await toolService.listTools({ ownerId: 'user-1', search: 'web' });

      const call = vi.mocked(prisma.tool.findMany).mock.calls[0]![0] as any;
      expect(call.where.AND[0].OR).toContainEqual(
        expect.objectContaining({ name: expect.objectContaining({ contains: 'web' }) }),
      );
    });
  });

  describe('updateTool', () => {
    it('should update owned tool and increment version', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(mockTool);
      vi.mocked(prisma.tool.update).mockResolvedValue({ ...mockTool, description: 'Updated', version: 2 });

      const result = await toolService.updateTool('tool-1', 'user-1', { description: 'Updated' });

      expect(prisma.tool.update).toHaveBeenCalledWith({
        where: { id: 'tool-1' },
        data: { description: 'Updated', version: 2 },
      });
      expect(result.version).toBe(2);
    });

    it('should throw 403 when not owner', async () => {
      const ownedTool = { ...mockTool, ownerId: 'user-2' };
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(ownedTool);

      await expect(toolService.updateTool('tool-1', 'user-1', { name: 'hack' })).rejects.toThrow(ApiError);
    });
  });

  describe('deleteTool', () => {
    it('should soft-delete owned tool', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(mockTool);

      await toolService.deleteTool('tool-1', 'user-1');

      expect(prisma.tool.update).toHaveBeenCalledWith({
        where: { id: 'tool-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 403 when not owner', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(mockTool);

      await expect(toolService.deleteTool('tool-1', 'user-2')).rejects.toThrow(ApiError);
    });
  });

  describe('executeTool', () => {
    it('should execute a tool by id', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(mockTool);
      vi.mocked(prisma.execution.create).mockResolvedValue({ id: 'exec-1' } as any);
      vi.mocked(prisma.execution.update).mockResolvedValue({} as any);

      const result = await toolService.executeTool({ toolId: 'tool-1', userId: 'user-1', parameters: { query: 'test' } });

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('executeToolByName', () => {
    it('should find tool by name and execute', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(mockTool);
      vi.mocked(prisma.execution.create).mockResolvedValue({ id: 'exec-1' } as any);
      vi.mocked(prisma.execution.update).mockResolvedValue({} as any);

      const result = await toolService.executeToolByName('web_search', 'user-1', { query: 'weather' });

      expect(result).toBeDefined();
    });

    it('should throw 404 when tool not found', async () => {
      vi.mocked(prisma.tool.findFirst).mockResolvedValue(null);

      await expect(toolService.executeToolByName('nonexistent', 'user-1', {})).rejects.toThrow(ApiError);
    });
  });

  describe('runToolExecution', () => {
    it('should handle api_call type', async () => {
      vi.mocked(prisma.execution.create).mockResolvedValue({ id: 'exec-1' } as any);
      vi.mocked(prisma.execution.update).mockResolvedValue({} as any);
      global.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ weather: 'sunny' }) });

      const result = await toolService.runToolExecution(
        mockApiTool as any,
        { city: 'London' },
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ weather: 'sunny' });
    });

    it('should handle code_execution type', async () => {
      vi.mocked(prisma.execution.create).mockResolvedValue({ id: 'exec-1' } as any);
      vi.mocked(prisma.execution.update).mockResolvedValue({} as any);

      const codeTool = { ...mockTool, config: { type: 'code_execution' } };
      const result = await toolService.runToolExecution(codeTool as any, { code: 'console.log(1)' }, 'user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('message', 'Code execution sandbox');
    });

    it('should handle web_search type', async () => {
      vi.mocked(prisma.execution.create).mockResolvedValue({ id: 'exec-1' } as any);
      vi.mocked(prisma.execution.update).mockResolvedValue({} as any);

      const searchTool = { ...mockTool, config: { type: 'web_search' } };
      const result = await toolService.runToolExecution(searchTool as any, { query: 'test' }, 'user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ query: 'test', results: [] });
    });

    it('should handle unsupported tool type', async () => {
      vi.mocked(prisma.execution.create).mockResolvedValue({ id: 'exec-1' } as any);
      vi.mocked(prisma.execution.update).mockResolvedValue({} as any);

      const unknownTool = { ...mockTool, config: { type: 'unknown_type' } };
      const result = await toolService.runToolExecution(unknownTool as any, {}, 'user-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('message');
    });

    it('should return error result when execution fails', async () => {
      vi.mocked(prisma.execution.create).mockRejectedValue(new Error('DB error'));

      const result = await toolService.runToolExecution(mockTool as any, {}, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('executeApiCall', () => {
    it('should make HTTP request and return JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ data: 'ok' }) });

      const result = await toolService.executeApiCall(
        { endpoint: 'https://api.example.com/data', method: 'GET', headers: {} },
        {},
      );

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });
      expect(result).toEqual({ data: 'ok' });
    });

    it('should POST with body', async () => {
      global.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({}) });

      await toolService.executeApiCall({ endpoint: 'https://api.example.com', method: 'POST' }, { key: 'val' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'val' }) }),
      );
    });

    it('should throw if endpoint missing', async () => {
      await expect(toolService.executeApiCall({ method: 'GET' }, {})).rejects.toThrow(ApiError);
    });
  });

  describe('executeWebSearch', () => {
    it('should throw if query missing', async () => {
      await expect(toolService.executeWebSearch({})).rejects.toThrow(ApiError);
    });

    it('should return search stub', async () => {
      const result = await toolService.executeWebSearch({ query: 'test' });
      expect(result).toEqual({ query: 'test', results: [] });
    });
  });
});
