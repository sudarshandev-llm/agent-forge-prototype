import { Request, Response, NextFunction } from 'express';
import { executionService } from '../services/agent-execution.service.js';

export async function getExecutionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const execution = await executionService.getExecutionById(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: execution });
  } catch (error) {
    next(error);
  }
}

export async function cancelExecutionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await executionService.cancelExecution(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getExecutionLogsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await executionService.getExecutionLogs(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
}

export async function listExecutionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, type } = req.query;
    const result = await executionService.listExecutions({
      userId: req.user!.userId,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      status: status as string | undefined,
      type: type as string | undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
