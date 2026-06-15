import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';

export async function getAgentAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const analytics = await analyticsService.getAgentAnalytics(
      req.params.agentId,
      req.user!.userId,
    );
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
}

export async function getTeamAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const analytics = await analyticsService.getTeamAnalytics(req.params.teamId, req.user!.userId);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
}

export async function getSystemAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const analytics = await analyticsService.getSystemAnalytics();
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
}

export async function getUsageReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to, granularity } = req.query;
    const report = await analyticsService.getUsageReport(req.user!.userId, {
      from: from as string | undefined,
      to: to as string | undefined,
      granularity: granularity as string | undefined,
    });
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function getCostReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query;
    const report = await analyticsService.getCostReport(req.user!.userId, {
      from: from as string | undefined,
      to: to as string | undefined,
    });
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}
