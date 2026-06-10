import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  createListingHandler,
  getListingHandler,
  listListingsHandler,
  updateListingHandler,
  deleteListingHandler,
  publishListingHandler,
  archiveListingHandler,
  createReviewHandler,
  getListingReviewsHandler,
  getUserListingsHandler,
} from '../controllers/marketplace.controller.js';

const router = Router();

router.get('/', listListingsHandler);
router.get('/:id', getListingHandler);
router.get('/:id/reviews', getListingReviewsHandler);

router.use(authenticate);

router.post('/', createListingHandler);
router.put('/:id', updateListingHandler);
router.delete('/:id', deleteListingHandler);
router.post('/:id/publish', publishListingHandler);
router.post('/:id/archive', archiveListingHandler);
router.post('/:id/reviews', createReviewHandler);
router.get('/user/me', getUserListingsHandler);

export default router;
