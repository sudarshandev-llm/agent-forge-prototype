import { Request, Response, NextFunction } from 'express';
import { workflowService } from '../services/workflow.service.js';

export async function createWorkflowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const workflow = await workflowService.createWorkflow({
      ...req.body,
      ownerId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
}

export async function getWorkflowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
}

export async function listWorkflowsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workflowService.listWorkflows(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkflowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.user!.userId, req.body);
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkflowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await workflowService.deleteWorkflow(req.params.id, req.user!.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function activateWorkflowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const workflow = await workflowService.activateWorkflow(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
}

export async function pauseWorkflowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const workflow = await workflowService.pauseWorkflow(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: workflow });
  } catch (error) {
    next(error);
  }
}

export async function runWorkflowHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workflowService.runWorkflow(req.params.id, req.user!.userId, req.body.input);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getWorkflowRunsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const runs = await workflowService.getWorkflowRuns(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: runs });
  } catch (error) {
    next(error);
  }
}
