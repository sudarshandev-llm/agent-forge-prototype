import { Router } from 'express';
import authRoutes from './auth.routes.js';
import agentRoutes from './agent.routes.js';
import teamRoutes from './team.routes.js';
import toolRoutes from './tool.routes.js';
import workflowRoutes from './workflow.routes.js';
import marketplaceRoutes from './marketplace.routes.js';
import analyticsRoutes from './analytics.routes.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(generalLimiter);

router.use('/auth', authRoutes);
router.use('/agents', agentRoutes);
router.use('/teams', teamRoutes);
router.use('/tools', toolRoutes);
router.use('/workflows', workflowRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
