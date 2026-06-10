import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createToolHandler,
  getToolHandler,
  listToolsHandler,
  updateToolHandler,
  deleteToolHandler,
  executeToolHandler,
} from '../controllers/tool.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listToolsHandler);
router.post('/', createToolHandler);
router.get('/:id', getToolHandler);
router.put('/:id', updateToolHandler);
router.delete('/:id', deleteToolHandler);
router.post('/:id/execute', executeToolHandler);

export default router;
