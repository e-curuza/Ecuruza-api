import { Router } from 'express';
import {
  becomeSeller,
  getMySellerProfile,
  submitSellerApplication,
  getMySellerApplication,
  getAllSellerApplications,
  getSellerApplicationById,
  reviewSellerApplication,
  updateBusinessInfo,
  getBusinessInfo,
} from '../controllers/seller.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { adminOnly } from '../middlewares/authenticate.js';
import {
  becomeSellerValidation,
  sellerApplicationValidation,
  businessInfoValidation,
  reviewSellerApplicationValidation,
  paginationValidation,
  validate,
} from '../middlewares/validations/user.validate.js';
import { uploadIdentityDocument } from '../middlewares/multer.js';

const router = Router();

router.post(
  '/apply',
  authenticate,
  uploadIdentityDocument.single('idCard'),
  sellerApplicationValidation,
  validate,
  submitSellerApplication
);

router.get('/application', authenticate, getMySellerApplication);

router.get('/business-info', authenticate, getBusinessInfo);

router.put(
  '/business-info',
  authenticate,
  uploadIdentityDocument.single('idCard'),
  businessInfoValidation,
  validate,
  updateBusinessInfo
);

router.post(
  '/become-seller',
  authenticate,
  becomeSellerValidation,
  validate,
  becomeSeller
);

router.get('/application', authenticate, getMySellerApplication);

router.post(
  '/become-seller',
  authenticate,
  becomeSellerValidation,
  validate,
  becomeSeller
);

router.get('/profile', authenticate, getMySellerProfile);

router.get(
  '/applications',
  authenticate,
  adminOnly,
  paginationValidation,
  validate,
  getAllSellerApplications
);

router.get(
  '/applications/:id',
  authenticate,
  adminOnly,
  getSellerApplicationById
);

router.post(
  '/applications/:id/review',
  authenticate,
  adminOnly,
  reviewSellerApplicationValidation,
  validate,
  reviewSellerApplication
);

export default router;
