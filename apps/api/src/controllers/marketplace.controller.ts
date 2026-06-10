import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service.js';

export async function createListingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await marketplaceService.createListing({
      ...req.body,
      authorId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
}

export async function getListingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await marketplaceService.getListingById(req.params.id);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
}

export async function listListingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, type, category, search, sort } = req.query;
    const result = await marketplaceService.listListings({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      type: type as string | undefined,
      category: category as string | undefined,
      search: search as string | undefined,
      sort: sort as string | undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function updateListingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await marketplaceService.updateListing(req.params.id, req.user!.userId, req.body);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
}

export async function deleteListingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await marketplaceService.deleteListing(req.params.id, req.user!.userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function publishListingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await marketplaceService.publishListing(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
}

export async function archiveListingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await marketplaceService.archiveListing(req.params.id, req.user!.userId);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    next(error);
  }
}

export async function createReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await marketplaceService.createReview(req.params.id, {
      ...req.body,
      userId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function getListingReviewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await marketplaceService.getListingReviews(req.params.id);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
}

export async function getUserListingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await marketplaceService.getUserListings(req.user!.userId);
    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
}
