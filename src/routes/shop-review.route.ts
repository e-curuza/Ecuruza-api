import { Router } from 'express';
import {
  createShopReview,
  getShopReviews,
  getShopReviewsByUser,
  updateShopReview,
  deleteShopReview,
  getShopRatingSummary,
} from '../controllers/shop-review.controller.js';
import { authenticate, optionalAuth } from '../middlewares/authenticate.js';
import {
  createShopReviewValidation,
  updateShopReviewValidation,
  deleteShopReviewValidation,
  getShopReviewsValidation,
  getShopReviewsByUserValidation,
  getShopRatingSummaryValidation,
} from '../middlewares/validations/shop-review.validate.js';

const router = Router();

// Public routes
router.get('/shop/:shopId', getShopReviewsValidation, getShopReviews);
router.get('/shop/:shopId/rating-summary', getShopRatingSummaryValidation, getShopRatingSummary);

// Protected routes - require authentication
router.post('/', authenticate, createShopReviewValidation, createShopReview);
router.get('/my-reviews', authenticate, getShopReviewsByUserValidation, getShopReviewsByUser);
router.put('/:id', authenticate, updateShopReviewValidation, updateShopReview);
router.delete('/:id', authenticate, deleteShopReviewValidation, deleteShopReview);

export default router;
