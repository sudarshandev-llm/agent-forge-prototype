import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { teams } from "./teams";

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt"),
    model: text("model").notNull(),
    provider: text("provider").notNull().default("openai"),
    temperature: numeric("temperature").default("0.7"),
    maxTokens: integer("max_tokens").default(2048),
    memoryConfig: jsonb("memory_config"),
    tools: text("tools").array(),
    role: text("role").default("executor"),
    ownerId: uuid("owner_id")
      .references(() => users.id)
      .notNull(),
    teamId: uuid("team_id").references(() => teams.id),
    status: text("status").default("idle"),
    version: integer("version").default(1),
    metadata: jsonb("metadata"),
    isTemplate: boolean("is_template").default(false),
    isPublic: boolean("is_public").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    ownerIdx: table.index("idx_agents_owner_id").on(table.ownerId),
    teamIdx: table.index("idx_agents_team_id").on(table.teamId),
    activeIdx: table.index("idx_agents_active").on(table.deletedAt).where(
      // @ts-ignore
      () => table.deletedAt.isNull(),
    ),
  }),
);
