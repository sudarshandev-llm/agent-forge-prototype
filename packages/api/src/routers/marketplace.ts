import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { router, authProcedure, publicProcedure } from "../trpc.js";

const publishListingSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  summary: z.string().default(""),
  category: z.enum(["agent", "workflow", "team", "tool", "template"]),
  tags: z.array(z.string()).default([]),
  version: z.string().default("1.0.0"),
  author: z.string().default(""),
  content: z.record(z.unknown()).default({}),
  pricing: z.union([z.literal("free"), z.object({ amount: z.number(), currency: z.string().default("USD") })]).default("free"),
  screenshots: z.array(z.string()).default([]),
  documentation: z.string().default(""),
  requirements: z.array(z.string()).default([]),
  license: z.string().default("MIT"),
});

const addReviewSchema = z.object({
  listingId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().default(""),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
});

export interface MarketplaceReview {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  content: string;
  pros: string[];
  cons: string[];
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  name: string;
  description: string;
  summary: string;
  category: "agent" | "workflow" | "team" | "tool" | "template";
  tags: string[];
  version: string;
  author: string;
  content: Record<string, unknown>;
  pricing: "free" | { amount: number; currency: string };
  screenshots: string[];
  documentation: string;
  requirements: string[];
  license: string;
  publisherId: string;
  publisherName: string;
  downloads: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

const listings = new Map<string, MarketplaceListing>();
const reviews = new Map<string, MarketplaceReview>();

function paginate<T>(items: T[], page: number, limit: number): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return { items: paged, total, page, limit, totalPages };
}

function recalcRating(listingId: string): void {
  const listing = listings.get(listingId);
  if (!listing) return;
  const listingReviews = Array.from(reviews.values()).filter((r) => r.listingId === listingId);
  const totalRating = listingReviews.reduce((sum, r) => sum + r.rating, 0);
  listing.averageRating = listingReviews.length > 0 ? Math.round((totalRating / listingReviews.length) * 10) / 10 : 0;
  listing.reviewCount = listingReviews.length;
  listings.set(listingId, listing);
}

export const marketplaceRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.enum(["agent", "workflow", "team", "tool", "template"]).optional(),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "popular", "rating", "name"]).default("newest"),
        page: z.number().default(1),
        limit: z.number().default(20),
        filters: z.record(z.unknown()).default({}),
      })
    )
    .query(async ({ input }) => {
      let list = Array.from(listings.values());
      if (input.category) {
        list = list.filter((l) => l.category === input.category);
      }
      if (input.search) {
        const lower = input.search.toLowerCase();
        list = list.filter(
          (l) =>
            l.name.toLowerCase().includes(lower) ||
            l.description.toLowerCase().includes(lower) ||
            l.tags.some((t) => t.toLowerCase().includes(lower))
        );
      }
      switch (input.sortBy) {
        case "newest":
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          break;
        case "popular":
          list.sort((a, b) => b.downloads - a.downloads);
          break;
        case "rating":
          list.sort((a, b) => b.averageRating - a.averageRating);
          break;
        case "name":
          list.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
      return paginate(list, input.page, input.limit);
    }),

  getListingById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const listing = listings.get(input.id);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      return listing;
    }),

  publish: authProcedure
    .input(publishListingSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const listing: MarketplaceListing = {
        id: nanoid(),
        ...input,
        publisherId: ctx.userId!,
        publisherName: ctx.user?.name ?? "Unknown",
        downloads: 0,
        averageRating: 0,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      listings.set(listing.id, listing);
      return listing;
    }),

  addReview: authProcedure
    .input(addReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const listing = listings.get(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      const existingReview = Array.from(reviews.values()).find(
        (r) => r.listingId === input.listingId && r.userId === ctx.userId
      );
      if (existingReview) {
        throw new TRPCError({ code: "CONFLICT", message: "You have already reviewed this listing" });
      }
      const review: MarketplaceReview = {
        id: nanoid(),
        listingId: input.listingId,
        userId: ctx.userId!,
        userName: ctx.user?.name ?? "Anonymous",
        rating: input.rating,
        title: input.title,
        content: input.content,
        pros: input.pros,
        cons: input.cons,
        createdAt: new Date().toISOString(),
      };
      reviews.set(review.id, review);
      recalcRating(input.listingId);
      return review;
    }),

  download: publicProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ input }) => {
      const listing = listings.get(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      listing.downloads += 1;
      listings.set(input.listingId, listing);
      return { downloaded: true, listingId: input.listingId, downloads: listing.downloads };
    }),
});
