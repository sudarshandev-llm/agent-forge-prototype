import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const tools = pgTable(
  "tool_registry",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    type: text("type").notNull(),
    category: text("category").default("general"),
    config: jsonb("config"),
    schema: jsonb("schema"),
    ownerId: uuid("owner_id").references(() => users.id),
    isBuiltin: boolean("is_builtin").default(false),
    isPublic: boolean("is_public").default(false),
    version: integer("version").default(1),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    nameIdx: index("idx_tool_registry_name").on(table.name),
    ownerIdx: index("idx_tool_registry_owner_id").on(table.ownerId),
    categoryIdx: index("idx_tool_registry_category").on(table.category),
  }),
);
