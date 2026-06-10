export enum ListingType {
  AGENT = 'agent',
  TOOL = 'tool',
  WORKFLOW = 'workflow',
  TEAM = 'team',
}

export enum ListingStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  BANNED = 'banned',
}

export interface IListing {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  type: ListingType;
  status: ListingStatus;
  price: number;
  currency: string;
  authorId: string;
  sourceId: string;
  sourceType: string;
  category: string;
  tags: string[];
  mediaUrls: string[];
  documentationUrl: string | null;
  version: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface IReview {
  id: string;
  listingId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ICreateListingDTO {
  name: string;
  description: string;
  shortDescription: string;
  type: ListingType;
  price?: number;
  currency?: string;
  sourceId: string;
  sourceType: string;
  category: string;
  tags?: string[];
  mediaUrls?: string[];
  documentationUrl?: string;
}

export interface ICreateReviewDTO {
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
}
