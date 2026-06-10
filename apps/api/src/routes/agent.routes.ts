import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiLimiter, executionLimiter } from '../middleware/rateLimiter.js';
import {
  createAgentHandler,
  getAgentHandler,
  listAgentsHandler,
  updateAgentHandler,
  deleteAgentHandler,
  executeAgentHandler,
  getAgentExecutionsHandler,
  forkAgentHandler,
} from '../controllers/agent.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', apiLimiter, listAgentsHandler);
router.post('/', apiLimiter, createAgentHandler);
router.get('/:id', getAgentHandler);
router.put('/:id', updateAgentHandler);
router.delete('/:id', deleteAgentHandler);
router.post('/:id/execute', executionLimiter, executeAgentHandler);
router.get('/:id/executions', getAgentExecutionsHandler);
router.post('/:id/fork', forkAgentHandler);

export default router;
