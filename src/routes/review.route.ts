import { Router } from 'express';
import {
  createReview,
  getReviewsByProduct,
  getReviewsByUser,
  updateReview,
  deleteReview,
  getProductRatingSummary,
} from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  createReviewValidation,
  updateReviewValidation,
  deleteReviewValidation,
  getReviewsByProductValidation,
  getReviewsByUserValidation,
  getProductRatingSummaryValidation,
} from '../middlewares/validations/review.validate.js';

const router = Router();

// Public routes
router.get('/product/:productId', getReviewsByProductValidation, getReviewsByProduct);
router.get('/product/:productId/summary', getProductRatingSummaryValidation, getProductRatingSummary);

// Protected routes
router.use(authenticate);
router.post('/', createReviewValidation, createReview);
router.get('/user', getReviewsByUserValidation, getReviewsByUser);
router.put('/:id', updateReviewValidation, updateReview);
router.delete('/:id', deleteReviewValidation, deleteReview);

export default router;