import { Request, Response, NextFunction } from 'express';
import { toolService } from '../services/tool.service.js';

export async function createToolHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tool = await toolService.createTool({
      ...req.body,
      ownerId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: tool });
  } catch (error) {
    next(error);
  }
}

export async function getToolHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tool = await toolService.getToolById(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    next(error);
  }
}

export async function listToolsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, type, search } = req.query;
    const result = await toolService.listTools({
      ownerId: req.user!.userId,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      type: type as string | undefined,
      search: search as string | undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function updateToolHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tool = await toolService.updateTool(req.params.id, req.user!.userId, req.body);
    res.status(200).json({ success: true, data: tool });
  } catch (error) {
    next(error);
  }
}

export async function deleteToolHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await toolService.deleteTool(req.params.id, req.user!.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function executeToolHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await toolService.executeTool({
      toolId: req.params.id,
      userId: req.user!.userId,
      parameters: req.body.parameters,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
