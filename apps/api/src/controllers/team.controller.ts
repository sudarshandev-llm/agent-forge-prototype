import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service.js';

export async function createTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.createTeam({
      ...req.body,
      ownerId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function getTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.getTeamById(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function listTeamsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await teamService.listTeams(req.user!.userId);
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
}

export async function updateTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const team = await teamService.updateTeam(req.params.id, req.user!.userId, req.body);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await teamService.deleteTeam(req.params.id, req.user!.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function addMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await teamService.addMember(req.params.id, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function removeMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await teamService.removeMember(req.params.id, req.user!.userId, req.params.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRoleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await teamService.updateMemberRole(
      req.params.id,
      req.user!.userId,
      req.params.userId,
      req.body.role,
    );
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function getTeamAgentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const agents = await teamService.getTeamAgents(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
}
