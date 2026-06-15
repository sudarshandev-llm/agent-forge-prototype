import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
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

function getFKTargets(table: any): Map<string, any> {
  const config = getTableConfig(table);
  const targets = new Map<string, any>();
  for (const fk of config.foreignKeys) {
    const ref = fk.reference();
    for (let i = 0; i < ref.columns.length; i++) {
      targets.set(ref.columns[i].name, ref.foreignTable);
    }
  }
  return targets;
}

function getIndexNames(table: any): string[] {
  const config = getTableConfig(table);
  return config.indexes.map((i: any) => i.config?.name ?? i.name);
}

function getColumns(table: any): Record<string, any> {
  return table[Symbol.for('drizzle:Columns')] ?? table;
}

describe('Schema definitions', () => {
  describe('users table', () => {
    it('should be defined', () => {
      expect(users).toBeDefined();
    });

    it('should have required columns', () => {
      const columns = getColumns(users);
      expect(columns.id).toBeDefined();
      expect(columns.email).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.createdAt).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });

    it('should have unique email constraint', () => {
      expect(users.email.isUnique).toBe(true);
    });
  });

  describe('agents table', () => {
    it('should be defined', () => {
      expect(agents).toBeDefined();
    });

    it('should have required columns', () => {
      const columns = getColumns(agents);
      expect(columns.id).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.model).toBeDefined();
      expect(columns.provider).toBeDefined();
      expect(columns.ownerId).toBeDefined();
    });

    it('should have default values', () => {
      const columns = getColumns(agents);
      expect(columns.temperature.default).toBe('0.7');
      expect(columns.maxTokens.default).toBe(2048);
      expect(columns.role.default).toBe('executor');
      expect(columns.version.default).toBe(1);
    });

    it('should have foreign key to users', () => {
      const targets = getFKTargets(agents);
      expect(targets.get('owner_id')).toBe(users);
    });

    it('should have foreign key to teams (nullable)', () => {
      const targets = getFKTargets(agents);
      expect(targets.get('team_id')).toBe(teams);
    });

    it('should define indexes', () => {
      const idxNames = getIndexNames(agents);
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
      const targets = getFKTargets(teams);
      expect(targets.get('owner_id')).toBe(users);
    });

    it('should have default max_members', () => {
      const columns = getColumns(teams);
      expect(columns.maxMembers.default).toBe(10);
    });
  });

  describe('workflows table', () => {
    it('should be defined', () => {
      expect(workflows).toBeDefined();
    });

    it('should have foreign keys', () => {
      const targets = getFKTargets(workflows);
      expect(targets.get('owner_id')).toBe(users);
      expect(targets.get('team_id')).toBe(teams);
    });

    it('should have default values', () => {
      const columns = getColumns(workflows);
      expect(columns.status.default).toBe('draft');
      expect(columns.version.default).toBe(1);
    });
  });

  describe('executions table', () => {
    it('should be defined', () => {
      expect(executions).toBeDefined();
    });

    it('should have foreign keys', () => {
      const targets = getFKTargets(executions);
      expect(targets.get('owner_id')).toBe(users);
      expect(targets.get('agent_id')).toBe(agents);
      expect(targets.get('workflow_id')).toBe(workflows);
    });

    it('should have default status', () => {
      const columns = getColumns(executions);
      expect(columns.status.default).toBe('pending');
    });
  });

  describe('tool_registry table', () => {
    it('should be defined', () => {
      expect(tools).toBeDefined();
    });

    it('should have unique name', () => {
      expect(tools.name.isUnique).toBe(true);
    });

    it('should have indexes', () => {
      const idxNames = getIndexNames(tools);
      expect(idxNames).toContain('idx_tool_registry_name');
      expect(idxNames).toContain('idx_tool_registry_category');
    });
  });

  describe('marketplace_listings table', () => {
    it('should be defined', () => {
      expect(marketplaceListings).toBeDefined();
    });

    it('should have foreign key to users', () => {
      const targets = getFKTargets(marketplaceListings);
      expect(targets.get('author_id')).toBe(users);
    });

    it('should have default values', () => {
      const columns = getColumns(marketplaceListings);
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
      const targets = getFKTargets(marketplaceReviews);
      expect(targets.get('listing_id')).toBe(marketplaceListings);
      expect(targets.get('user_id')).toBe(users);
    });

    it('should have required rating', () => {
      const columns = getColumns(marketplaceReviews);
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
