import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { teams } from './teams';

export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    triggerType: text('trigger_type').default('manual'),
    triggerConfig: jsonb('trigger_config'),
    status: text('status').default('draft'),
    ownerId: uuid('owner_id')
      .references(() => users.id)
      .notNull(),
    teamId: uuid('team_id').references(() => teams.id),
    nodes: jsonb('nodes'),
    edges: jsonb('edges'),
    version: integer('version').default(1),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    ownerIdx: index('idx_workflows_owner_id').on(table.ownerId),
    teamIdx: index('idx_workflows_team_id').on(table.teamId),
  }),
);
