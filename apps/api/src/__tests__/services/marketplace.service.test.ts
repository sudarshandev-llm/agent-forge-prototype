import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../config/database.js';
import { marketplaceService } from '../../services/marketplace.service.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { ListingStatus } from '@agentforge/shared';

const mockListing = {
  id: 'listing-1',
  name: 'Smart Chat Agent',
  description: 'A full description of the agent',
  shortDescription: 'An intelligent chat agent',
  type: 'agent',
  status: ListingStatus.PUBLISHED,
  price: 0,
  currency: 'usd',
  authorId: 'user-1',
  sourceId: 'agent-1',
  sourceType: 'agent',
  category: 'chat',
  tags: ['ai', 'chat'],
  mediaUrls: [],
  documentationUrl: null,
  version: '1.0.0',
  downloads: 100,
  rating: 4.5,
  reviewCount: 10,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
};

describe('marketplaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a draft listing', async () => {
      vi.mocked(prisma.marketplaceListing.create).mockResolvedValue(mockListing);

      const result = await marketplaceService.createListing({
        name: 'Smart Chat Agent',
        description: 'A full description',
        shortDescription: 'An intelligent chat agent',
        type: 'agent',
        sourceId: 'agent-1',
        sourceType: 'agent',
        category: 'chat',
        authorId: 'user-1',
      });

      expect(prisma.marketplaceListing.create).toHaveBeenCalledWith({
        data: {
          name: 'Smart Chat Agent',
          description: 'A full description',
          shortDescription: 'An intelligent chat agent',
          type: 'agent',
          sourceId: 'agent-1',
          sourceType: 'agent',
          category: 'chat',
          price: 0,
          tags: [],
          authorId: 'user-1',
          status: ListingStatus.DRAFT,
          version: '1.0.0',
        },
      });
      expect(result.status).toBe(ListingStatus.PUBLISHED);
    });

    it('should include optional price and tags', async () => {
      vi.mocked(prisma.marketplaceListing.create).mockResolvedValue(mockListing);

      await marketplaceService.createListing({
        name: 'Premium Agent',
        description: 'Desc',
        shortDescription: 'Short',
        type: 'agent',
        sourceId: 'agent-2',
        sourceType: 'agent',
        category: 'productivity',
        price: 19.99,
        tags: ['premium', 'productivity'],
        authorId: 'user-1',
      });

      expect(prisma.marketplaceListing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: 19.99, tags: ['premium', 'productivity'] }),
        }),
      );
    });
  });

  describe('getListingById', () => {
    it('should return published listing', async () => {
      const listingWithAuthor = {
        ...mockListing,
        author: { id: 'user-1', name: 'Author', avatarUrl: null },
        _count: { reviews: 5 },
      };
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(listingWithAuthor as any);

      const result = await marketplaceService.getListingById('listing-1');

      expect(result.id).toBe('listing-1');
    });

    it('should throw 404 for archived listing', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue({
        ...mockListing,
        status: ListingStatus.ARCHIVED,
      } as any);

      await expect(marketplaceService.getListingById('listing-1')).rejects.toThrow(ApiError);
    });

    it('should throw 404 when not found', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(null);

      await expect(marketplaceService.getListingById('bad-id')).rejects.toThrow(ApiError);
    });
  });

  describe('listListings', () => {
    it('should return paginated published listings', async () => {
      vi.mocked(prisma.marketplaceListing.findMany).mockResolvedValue([mockListing]);
      vi.mocked(prisma.marketplaceListing.count).mockResolvedValue(1);

      const result = await marketplaceService.listListings({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by type and category', async () => {
      vi.mocked(prisma.marketplaceListing.findMany).mockResolvedValue([]);
      vi.mocked(prisma.marketplaceListing.count).mockResolvedValue(0);

      await marketplaceService.listListings({ type: 'tool', category: 'search' });

      const where = vi.mocked(prisma.marketplaceListing.findMany).mock.calls[0]![0] as any;
      expect(where.where.type).toBe('tool');
      expect(where.where.category).toBe('search');
    });

    it('should search listings', async () => {
      vi.mocked(prisma.marketplaceListing.findMany).mockResolvedValue([]);
      vi.mocked(prisma.marketplaceListing.count).mockResolvedValue(0);

      await marketplaceService.listListings({ search: 'chat bot' });

      const where = vi.mocked(prisma.marketplaceListing.findMany).mock.calls[0]![0] as any;
      expect(where.where.OR).toBeDefined();
    });

    it('should sort by different criteria', async () => {
      vi.mocked(prisma.marketplaceListing.findMany).mockResolvedValue([]);
      vi.mocked(prisma.marketplaceListing.count).mockResolvedValue(0);

      await marketplaceService.listListings({ sort: 'rating' });

      const findArgs = vi.mocked(prisma.marketplaceListing.findMany).mock.calls[0]![0] as any;
      expect(findArgs.orderBy).toEqual({ rating: 'desc' });
    });

    it('should default sort by downloads', async () => {
      vi.mocked(prisma.marketplaceListing.findMany).mockResolvedValue([]);
      vi.mocked(prisma.marketplaceListing.count).mockResolvedValue(0);

      await marketplaceService.listListings({});

      const findArgs = vi.mocked(prisma.marketplaceListing.findMany).mock.calls[0]![0] as any;
      expect(findArgs.orderBy).toEqual({ downloads: 'desc' });
    });
  });

  describe('updateListing', () => {
    it('should update when user is author', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(mockListing);
      vi.mocked(prisma.marketplaceListing.update).mockResolvedValue({
        ...mockListing,
        name: 'Updated Name',
      });

      const result = await marketplaceService.updateListing('listing-1', 'user-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw 403 when not author', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(mockListing);

      await expect(
        marketplaceService.updateListing('listing-1', 'user-2', { name: 'Hack' }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteListing', () => {
    it('should delete when user is author', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(mockListing);

      await marketplaceService.deleteListing('listing-1', 'user-1');

      expect(prisma.marketplaceListing.delete).toHaveBeenCalledWith({ where: { id: 'listing-1' } });
    });

    it('should throw 404 when listing not found', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(null);

      await expect(marketplaceService.deleteListing('bad-id', 'user-1')).rejects.toThrow(ApiError);
    });
  });

  describe('publishListing', () => {
    it('should publish a draft listing', async () => {
      const draftListing = { ...mockListing, status: ListingStatus.DRAFT };
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(draftListing);
      vi.mocked(prisma.marketplaceListing.update).mockResolvedValue(mockListing);

      const result = await marketplaceService.publishListing('listing-1', 'user-1');

      expect(prisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { status: ListingStatus.PUBLISHED, publishedAt: expect.any(Date) },
      });
      expect(result.status).toBe(ListingStatus.PUBLISHED);
    });
  });

  describe('archiveListing', () => {
    it('should archive a published listing', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(mockListing);
      vi.mocked(prisma.marketplaceListing.update).mockResolvedValue({
        ...mockListing,
        status: ListingStatus.ARCHIVED,
      });

      const result = await marketplaceService.archiveListing('listing-1', 'user-1');

      expect(prisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { status: ListingStatus.ARCHIVED },
      });
      expect(result.status).toBe(ListingStatus.ARCHIVED);
    });
  });

  describe('createReview', () => {
    it('should create a review and update rating', async () => {
      const existingReviews = [{ rating: 4 }, { rating: 5 }];
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(mockListing);
      vi.mocked(prisma.marketplaceReview.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.marketplaceReview.create).mockResolvedValue({
        id: 'review-1',
        listingId: 'listing-1',
        userId: 'user-2',
        rating: 5,
        title: 'Great!',
        content: 'Works well',
        pros: ['fast'],
        cons: [],
      } as any);
      vi.mocked(prisma.marketplaceReview.findMany).mockResolvedValue(existingReviews as any);

      const result = await marketplaceService.createReview('listing-1', {
        userId: 'user-2',
        rating: 5,
        title: 'Great!',
        content: 'Works well',
        pros: ['fast'],
      });

      expect(prisma.marketplaceReview.create).toHaveBeenCalled();
      expect(prisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { rating: 4.5, reviewCount: 2 },
      });
    });

    it('should throw 400 when reviewing own listing', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(mockListing);

      await expect(
        marketplaceService.createReview('listing-1', {
          userId: 'user-1',
          rating: 5,
          title: 'Mine',
          content: 'Great',
        }),
      ).rejects.toThrow(ApiError);
    });

    it('should throw 409 when duplicate review', async () => {
      vi.mocked(prisma.marketplaceListing.findUnique).mockResolvedValue(mockListing);
      vi.mocked(prisma.marketplaceReview.findUnique).mockResolvedValue({} as any);

      await expect(
        marketplaceService.createReview('listing-1', {
          userId: 'user-2',
          rating: 3,
          title: 'OK',
          content: 'Decent',
        }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getListingReviews', () => {
    it('should return reviews with user info', async () => {
      const reviews = [
        {
          id: 'r-1',
          listingId: 'listing-1',
          userId: 'user-2',
          rating: 5,
          title: 'Great',
          content: 'Love it',
          pros: [],
          cons: [],
          user: { id: 'user-2', name: 'User', avatarUrl: null },
        },
      ];
      vi.mocked(prisma.marketplaceReview.findMany).mockResolvedValue(reviews as any);

      const result = await marketplaceService.getListingReviews('listing-1');

      expect(prisma.marketplaceReview.findMany).toHaveBeenCalledWith({
        where: { listingId: 'listing-1' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getUserListings', () => {
    it('should return user listings', async () => {
      vi.mocked(prisma.marketplaceListing.findMany).mockResolvedValue([mockListing]);

      const result = await marketplaceService.getUserListings('user-1');

      expect(prisma.marketplaceListing.findMany).toHaveBeenCalledWith({
        where: { authorId: 'user-1' },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateListingRating', () => {
    it('should recalculate average rating', async () => {
      vi.mocked(prisma.marketplaceReview.findMany).mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
      ] as any);

      await marketplaceService.updateListingRating('listing-1');

      expect(prisma.marketplaceListing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { rating: 4, reviewCount: 3 },
      });
    });

    it('should do nothing if no reviews', async () => {
      vi.mocked(prisma.marketplaceReview.findMany).mockResolvedValue([]);

      await marketplaceService.updateListingRating('listing-1');

      expect(prisma.marketplaceListing.update).not.toHaveBeenCalled();
    });
  });
});
