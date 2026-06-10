import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ListingStatus } from '@agentforge/shared';

export const marketplaceService = {
  async createListing(data: {
    name: string;
    description: string;
    shortDescription: string;
    type: string;
    sourceId: string;
    sourceType: string;
    category: string;
    price?: number;
    tags?: string[];
    authorId: string;
  }) {
    const listing = await prisma.marketplaceListing.create({
      data: {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription,
        type: data.type,
        sourceId: data.sourceId,
        sourceType: data.sourceType,
        category: data.category,
        price: data.price ?? 0,
        tags: data.tags ?? [],
        authorId: data.authorId,
        status: ListingStatus.DRAFT,
        version: '1.0.0',
      },
    });

    return listing;
  },

  async getListingById(id: string) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!listing || listing.status === ListingStatus.ARCHIVED) {
      throw new ApiError(404, 'Listing not found');
    }

    return listing;
  },

  async listListings(params: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    search?: string;
    sort?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: ListingStatus.PUBLISHED,
    };

    if (params.type) where.type = params.type;
    if (params.category) where.category = params.category;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { shortDescription: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> =
      params.sort === 'popular' ? { downloads: 'desc' } :
      params.sort === 'rating' ? { rating: 'desc' } :
      params.sort === 'newest' ? { createdAt: 'desc' } :
      { downloads: 'desc' };

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.marketplaceListing.count({ where: where as never }),
    ]);

    return {
      data: listings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  },

  async updateListing(id: string, userId: string, data: Record<string, unknown>) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.authorId !== userId) {
      throw new ApiError(403, 'Not authorized to update this listing');
    }

    return prisma.marketplaceListing.update({
      where: { id },
      data,
    });
  },

  async deleteListing(id: string, userId: string) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.authorId !== userId) {
      throw new ApiError(403, 'Not authorized to delete this listing');
    }

    await prisma.marketplaceListing.delete({ where: { id } });
  },

  async publishListing(id: string, userId: string) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.authorId !== userId) {
      throw new ApiError(403, 'Not authorized to publish this listing');
    }

    return prisma.marketplaceListing.update({
      where: { id },
      data: {
        status: ListingStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  },

  async archiveListing(id: string, userId: string) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id } });

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.authorId !== userId) {
      throw new ApiError(403, 'Not authorized to archive this listing');
    }

    return prisma.marketplaceListing.update({
      where: { id },
      data: { status: ListingStatus.ARCHIVED },
    });
  },

  async createReview(
    listingId: string,
    data: {
      userId: string;
      rating: number;
      title: string;
      content: string;
      pros?: string[];
      cons?: string[];
    },
  ) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });

    if (!listing) {
      throw new ApiError(404, 'Listing not found');
    }

    if (listing.authorId === data.userId) {
      throw new ApiError(400, 'Cannot review your own listing');
    }

    const existing = await prisma.marketplaceReview.findUnique({
      where: { listingId_userId: { listingId, userId: data.userId } },
    });

    if (existing) {
      throw new ApiError(409, 'You have already reviewed this listing');
    }

    const review = await prisma.marketplaceReview.create({
      data: {
        listingId,
        userId: data.userId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        pros: data.pros ?? [],
        cons: data.cons ?? [],
      },
    });

    await this.updateListingRating(listingId);

    return review;
  },

  async getListingReviews(listingId: string) {
    return prisma.marketplaceReview.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  },

  async getUserListings(userId: string) {
    return prisma.marketplaceListing.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async updateListingRating(listingId: string) {
    const reviews = await prisma.marketplaceReview.findMany({
      where: { listingId },
      select: { rating: true },
    });

    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length,
      },
    });
  },
};
