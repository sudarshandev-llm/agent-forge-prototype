import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: uuid('owner_id')
      .references(() => users.id)
      .notNull(),
    isPersonal: boolean('is_personal').default(false),
    maxMembers: integer('max_members').default(10),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    ownerIdx: index('idx_teams_owner_id').on(table.ownerId),
  }),
);
