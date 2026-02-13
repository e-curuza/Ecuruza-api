import { Router } from 'express';
import {
  createShop,
  updateShop,
  getMyShop,
  getShopById,
  getShopBySlug,
  deleteShop,
  getAllShops,
  incrementShopView,
  addShopReview,
  getShopReviews,
  deleteShopReview,
  getMyShopStats,
} from '../controllers/shop.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { uploadShopImages } from '../middlewares/multer.js';
import {
  createShopValidation,
  updateShopValidation,
  paginationValidation,
  shopReviewValidation,
  validate,
} from '../middlewares/validations/user.validate.js';

const router = Router();

router.post(
  '/',
  authenticate,
  uploadShopImages.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  createShopValidation,
  validate,
  createShop
);

router.put(
  '/:id',
  authenticate,
  uploadShopImages.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  updateShopValidation,
  validate,
  updateShop
);

router.get('/my-shop', authenticate, getMyShop);

router.get('/my-shop/stats', authenticate, getMyShopStats);

router.get('/all', paginationValidation, validate, getAllShops);

router.get('/slug/:slug', getShopBySlug);

router.get('/:id', getShopById);

router.post('/:id/view', incrementShopView);

router.post(
  '/:id/reviews',
  authenticate,
  shopReviewValidation,
  validate,
  addShopReview
);

router.get('/:id/reviews', paginationValidation, validate, getShopReviews);

router.delete('/:id/reviews/:reviewId', authenticate, deleteShopReview);

router.delete('/:id', authenticate, deleteShop);

export default router;
