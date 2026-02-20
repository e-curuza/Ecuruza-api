import { Router } from 'express';
import {
  sellerGetProfile,
  sellerUpdateProfile,
  sellerDashboard,
  sellerOnboardSubmitBusiness,
  sellerOnboardGetMyBusiness,
  sellerOnboardGetAllBusinesses,
  sellerOnboardGetBusinessById,
  sellerOnboardApproveBusiness,
} from '../controllers/seller.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { adminOnly } from '../middlewares/authenticate.js';
import {
  sellerApplicationValidation,
  reviewSellerApplicationValidation,
  sellerApplicationIdValidation,
  updateSellerProfileValidation,
  validate,
} from '../middlewares/validations/seller.validate.js';
import { uploadIdentityDocument } from '../middlewares/multer.js';

const router = Router();

router.post(
  '/onboarding',
  authenticate,
  uploadIdentityDocument.fields([
    { name: 'idCard', maxCount: 1 }
  ]),
  sellerApplicationValidation,
  validate,
  sellerOnboardSubmitBusiness
);

router.get('/applications/me', authenticate, sellerOnboardGetMyBusiness);

router.get('/me', authenticate, sellerGetProfile);

router.get('/dashboard', authenticate, sellerDashboard);

router.put(
  '/profile',
  authenticate,
  uploadIdentityDocument.fields([{ name: 'avatar', maxCount: 1 }]),
  updateSellerProfileValidation,
  validate,
  sellerUpdateProfile
);

router.get(
  '/applications',
  authenticate,
  adminOnly,
  validate,
  sellerOnboardGetAllBusinesses
);

router.get(
  '/applications/:id',
  authenticate,
  adminOnly,
  sellerApplicationIdValidation,
  validate,
  sellerOnboardGetBusinessById
);

router.post(
  '/applications/:id/review',
  authenticate,
  adminOnly,
  reviewSellerApplicationValidation,
  validate,
  sellerOnboardApproveBusiness
);

export default router;
