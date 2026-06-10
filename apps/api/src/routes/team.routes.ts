import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createTeamHandler,
  getTeamHandler,
  listTeamsHandler,
  updateTeamHandler,
  deleteTeamHandler,
  addMemberHandler,
  removeMemberHandler,
  updateMemberRoleHandler,
  getTeamAgentsHandler,
} from '../controllers/team.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listTeamsHandler);
router.post('/', createTeamHandler);
router.get('/:id', getTeamHandler);
router.put('/:id', updateTeamHandler);
router.delete('/:id', deleteTeamHandler);
router.post('/:id/members', addMemberHandler);
router.delete('/:id/members/:userId', removeMemberHandler);
router.put('/:id/members/:userId', updateMemberRoleHandler);
router.get('/:id/agents', getTeamAgentsHandler);

export default router;
