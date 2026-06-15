import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { agents } from './agents';
import { workflows } from './workflows';

export const executions = pgTable(
  'executions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').notNull(),
    status: text('status').default('pending'),
    trigger: text('trigger').default('manual'),
    input: jsonb('input'),
    output: jsonb('output'),
    error: text('error'),
    duration: integer('duration'),
    tokenUsage: jsonb('token_usage'),
    cost: numeric('cost'),
    ownerId: uuid('owner_id')
      .references(() => users.id)
      .notNull(),
    agentId: uuid('agent_id').references(() => agents.id),
    workflowId: uuid('workflow_id').references(() => workflows.id),
    steps: jsonb('steps'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('idx_executions_owner_id').on(table.ownerId),
    agentIdx: index('idx_executions_agent_id').on(table.agentId),
    workflowIdx: index('idx_executions_workflow_id').on(table.workflowId),
    statusIdx: index('idx_executions_status').on(table.status),
  }),
);
