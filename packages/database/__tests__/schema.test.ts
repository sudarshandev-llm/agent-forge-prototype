import { describe, it, expect } from 'vitest';
import {
  users,
  agents,
  teams,
  workflows,
  executions,
  tools,
  marketplaceListings,
  marketplaceReviews,
} from '../src/schema/index';

describe('Schema definitions', () => {
  describe('users table', () => {
    it('should be defined', () => {
      expect(users).toBeDefined();
    });

    it('should have required columns', () => {
      const columns = users[Symbol.for('drizzle:Columns')] ?? users;
      expect(columns.id).toBeDefined();
      expect(columns.email).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have unique email constraint', () => {
      expect(users.config?.uniqueConstraints).toBeDefined();
    });
  });

  describe('agents table', () => {
    it('should be defined', () => {
      expect(agents).toBeDefined();
    });

    it('should have required columns', () => {
      const columns = agents[Symbol.for('drizzle:Columns')] ?? agents;
      expect(columns.id).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.model).toBeDefined();
      expect(columns.provider).toBeDefined();
      expect(columns.ownerId).toBeDefined();
    });

    it('should have default values', () => {
      const columns = agents[Symbol.for('drizzle:Columns')] ?? agents;
      expect(columns.temperature.default).toBe('0.7');
      expect(columns.maxTokens.default).toBe(2048);
      expect(columns.role.default).toBe('executor');
      expect(columns.version.default).toBe(1);
    });

    it('should have foreign key to users', () => {
      const columns = agents[Symbol.for('drizzle:Columns')] ?? agents;
      expect(columns.ownerId.references).toBeDefined();
      expect(columns.ownerId.references?.table).toBe(users);
    });

    it('should have foreign key to teams (nullable)', () => {
      const columns = agents[Symbol.for('drizzle:Columns')] ?? agents;
      expect(columns.teamId.references).toBeDefined();
      expect(columns.teamId.references?.table).toBe(teams);
    });

    it('should define indexes', () => {
      expect(agents.config?.indexes).toBeDefined();
      const idxNames = agents.config?.indexes?.map((i: any) => i.name) ?? [];
      expect(idxNames).toContain('idx_agents_owner_id');
      expect(idxNames).toContain('idx_agents_team_id');
      expect(idxNames).toContain('idx_agents_active');
    });
  });

  describe('teams table', () => {
    it('should be defined', () => {
      expect(teams).toBeDefined();
    });

    it('should have foreign key to users', () => {
      const columns = teams[Symbol.for('drizzle:Columns')] ?? teams;
      expect(columns.ownerId.references).toBeDefined();
      expect(columns.ownerId.references?.table).toBe(users);
    });

    it('should have default max_members', () => {
      const columns = teams[Symbol.for('drizzle:Columns')] ?? teams;
      expect(columns.maxMembers.default).toBe(10);
    });
  });

  describe('workflows table', () => {
    it('should be defined', () => {
      expect(workflows).toBeDefined();
    });

    it('should have foreign keys', () => {
      const columns = workflows[Symbol.for('drizzle:Columns')] ?? workflows;
      expect(columns.ownerId.references?.table).toBe(users);
      expect(columns.teamId.references?.table).toBe(teams);
    });

    it('should have default values', () => {
      const columns = workflows[Symbol.for('drizzle:Columns')] ?? workflows;
      expect(columns.status.default).toBe('draft');
      expect(columns.version.default).toBe(1);
    });
  });

  describe('executions table', () => {
    it('should be defined', () => {
      expect(executions).toBeDefined();
    });

    it('should have foreign keys', () => {
      const columns = executions[Symbol.for('drizzle:Columns')] ?? executions;
      expect(columns.ownerId.references?.table).toBe(users);
      expect(columns.agentId.references?.table).toBe(agents);
      expect(columns.workflowId.references?.table).toBe(workflows);
    });

    it('should have default status', () => {
      const columns = executions[Symbol.for('drizzle:Columns')] ?? executions;
      expect(columns.status.default).toBe('pending');
    });
  });

  describe('tool_registry table', () => {
    it('should be defined', () => {
      expect(tools).toBeDefined();
    });

    it('should have unique name', () => {
      expect(tools.config?.uniqueConstraints).toBeDefined();
    });

    it('should have indexes', () => {
      const idxNames = tools.config?.indexes?.map((i: any) => i.name) ?? [];
      expect(idxNames).toContain('idx_tool_registry_name');
      expect(idxNames).toContain('idx_tool_registry_category');
    });
  });

  describe('marketplace_listings table', () => {
    it('should be defined', () => {
      expect(marketplaceListings).toBeDefined();
    });

    it('should have foreign key to users', () => {
      const columns = marketplaceListings[Symbol.for('drizzle:Columns')] ?? marketplaceListings;
      expect(columns.authorId.references?.table).toBe(users);
    });

    it('should have default values', () => {
      const columns = marketplaceListings[Symbol.for('drizzle:Columns')] ?? marketplaceListings;
      expect(columns.status.default).toBe('draft');
      expect(columns.price.default).toBe('0');
      expect(columns.currency.default).toBe('USD');
      expect(columns.version.default).toBe('1.0.0');
      expect(columns.downloads.default).toBe(0);
    });
  });

  describe('marketplace_reviews table', () => {
    it('should be defined', () => {
      expect(marketplaceReviews).toBeDefined();
    });

    it('should have foreign keys', () => {
      const columns = marketplaceReviews[Symbol.for('drizzle:Columns')] ?? marketplaceReviews;
      expect(columns.listingId.references?.table).toBe(marketplaceListings);
      expect(columns.userId.references?.table).toBe(users);
    });

    it('should have required rating', () => {
      const columns = marketplaceReviews[Symbol.for('drizzle:Columns')] ?? marketplaceReviews;
      expect(columns.rating.notNull).toBe(true);
    });
  });

  describe('all schemas are exported from index', () => {
    it('should export all tables', () => {
      expect(users).toBeDefined();
      expect(agents).toBeDefined();
      expect(teams).toBeDefined();
      expect(workflows).toBeDefined();
      expect(executions).toBeDefined();
      expect(tools).toBeDefined();
      expect(marketplaceListings).toBeDefined();
      expect(marketplaceReviews).toBeDefined();
    });
  });
});
