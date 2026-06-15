import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const marketplaceListings = pgTable(
  "marketplace_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    type: text("type").notNull(),
    status: text("status").default("draft"),
    price: numeric("price").default("0"),
    currency: text("currency").default("USD"),
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    sourceId: text("source_id"),
    sourceType: text("source_type"),
    category: text("category"),
    tags: text("tags").array(),
    mediaUrls: text("media_urls").array(),
    documentationUrl: text("documentation_url"),
    version: text("version").default("1.0.0"),
    downloads: integer("downloads").default(0),
    rating: numeric("rating").default("0"),
    reviewCount: integer("review_count").default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    publishedAt: timestamp("published_at"),
  },
  (table) => ({
    authorIdx: index("idx_marketplace_author_id").on(table.authorId),
    statusIdx: index("idx_marketplace_status").on(table.status),
    categoryIdx: index("idx_marketplace_category").on(table.category),
  }),
);

export const marketplaceReviews = pgTable(
  "marketplace_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .references(() => marketplaceListings.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    rating: integer("rating").notNull(),
    title: text("title"),
    content: text("content"),
    pros: text("pros").array(),
    cons: text("cons").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    listingIdx: index("idx_reviews_listing_id").on(table.listingId),
    userIdx: index("idx_reviews_user_id").on(table.userId),
  }),
);
