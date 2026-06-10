import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createWorkflowHandler,
  getWorkflowHandler,
  listWorkflowsHandler,
  updateWorkflowHandler,
  deleteWorkflowHandler,
  activateWorkflowHandler,
  pauseWorkflowHandler,
  runWorkflowHandler,
  getWorkflowRunsHandler,
} from '../controllers/workflow.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listWorkflowsHandler);
router.post('/', createWorkflowHandler);
router.get('/:id', getWorkflowHandler);
router.put('/:id', updateWorkflowHandler);
router.delete('/:id', deleteWorkflowHandler);
router.post('/:id/activate', activateWorkflowHandler);
router.post('/:id/pause', pauseWorkflowHandler);
router.post('/:id/run', runWorkflowHandler);
router.get('/:id/runs', getWorkflowRunsHandler);

export default router;
