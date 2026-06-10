export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface ITeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  lastActiveAt: string | null;
}

export interface ITeam {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  ownerId: string;
  isPersonal: boolean;
  maxMembers: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  members: ITeamMember[];
}

export interface ICreateTeamDTO {
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface IUpdateTeamDTO extends Partial<ICreateTeamDTO> {
  maxMembers?: number;
}

export interface IAddMemberDTO {
  userId: string;
  role: TeamRole;
}
