import { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent.service.js';
import { executionService } from '../services/agent-execution.service.js';

export async function createAgentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const agent = await agentService.createAgent({
      ...req.body,
      ownerId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function getAgentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const agent = await agentService.getAgentById(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function listAgentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, status, search } = req.query;
    const result = await agentService.listAgents({
      ownerId: req.user!.userId,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function updateAgentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.user!.userId, req.body);
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
}

export async function deleteAgentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await agentService.deleteAgent(req.params.id, req.user!.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function executeAgentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await executionService.executeAgent({
      agentId: req.params.id,
      userId: req.user!.userId,
      input: req.body.input,
      stream: req.body.stream ?? false,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAgentExecutionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const executions = await agentService.getAgentExecutions(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: executions });
  } catch (error) {
    next(error);
  }
}

export async function forkAgentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const forked = await agentService.forkAgent(req.params.id, req.user!.userId, req.body.name);
    res.status(201).json({ success: true, data: forked });
  } catch (error) {
    next(error);
  }
}
