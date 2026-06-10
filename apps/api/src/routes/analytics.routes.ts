import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getAgentAnalyticsHandler,
  getTeamAnalyticsHandler,
  getSystemAnalyticsHandler,
  getUsageReportHandler,
  getCostReportHandler,
} from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate);

router.get('/agents/:agentId', getAgentAnalyticsHandler);
router.get('/teams/:teamId', getTeamAnalyticsHandler);
router.get('/system', requireRole('admin'), getSystemAnalyticsHandler);
router.get('/usage', getUsageReportHandler);
router.get('/costs', getCostReportHandler);

export default router;
