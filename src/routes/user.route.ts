import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  getMyProfile,
  updateMyProfile,
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getMyOrders,
  getMyOrderById,
  getMyReviews,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getMyMessages,
  markMessageRead,
  getPublicProfile,
  deleteMyAccount,
  getMyActivity,
} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { adminOnly } from '../middlewares/authenticate.js';
import { uploadAvatar } from '../middlewares/multer.js';
import {
  updateUserValidation,
  createAddressValidation,
  updateAddressValidation,
  paginationValidation,
  userFiltersValidation,
  deleteAccountValidation,
  suspendUserValidation,
  validate,
} from '../middlewares/validations/user.validate.js';

const router = Router();

router.get('/public/:id', getPublicProfile);

router.get(
  '/',
  authenticate,
  adminOnly,
  paginationValidation,
  userFiltersValidation,
  validate,
  getAllUsers
);

router.get(
  '/:id',
  authenticate,
  adminOnly,
  getUserById
);

router.put(
  '/:id',
  authenticate,
  adminOnly,
  updateUserValidation,
  validate,
  updateUser
);

router.delete(
  '/:id',
  authenticate,
  adminOnly,
  deleteUser
);

router.post(
  '/:id/suspend',
  authenticate,
  adminOnly,
  suspendUserValidation,
  validate,
  suspendUser
);

router.post(
  '/:id/activate',
  authenticate,
  adminOnly,
  activateUser
);

router.get('/me/profile', authenticate, getMyProfile);

router.put(
  '/me/profile',
  authenticate,
  uploadAvatar.single('avatar'),
  updateUserValidation,
  validate,
  updateMyProfile
);

router.get('/me/addresses', authenticate, getMyAddresses);

router.post(
  '/me/addresses',
  authenticate,
  createAddressValidation,
  validate,
  createAddress
);

router.put(
  '/me/addresses/:id',
  authenticate,
  updateAddressValidation,
  validate,
  updateAddress
);

router.delete('/me/addresses/:id', authenticate, deleteAddress);

router.post('/me/addresses/:id/default', authenticate, setDefaultAddress);

router.get('/me/orders', authenticate, paginationValidation, validate, getMyOrders);

router.get('/me/orders/:id', authenticate, getMyOrderById);

router.get('/me/reviews', authenticate, paginationValidation, validate, getMyReviews);

router.get('/me/notifications', authenticate, paginationValidation, validate, getMyNotifications);

router.post('/me/notifications/:id/read', authenticate, markNotificationRead);

router.post('/me/notifications/read-all', authenticate, markAllNotificationsRead);

router.get('/me/messages', authenticate, paginationValidation, validate, getMyMessages);

router.post('/me/messages/:id/read', authenticate, markMessageRead);

router.delete(
  '/me/account',
  authenticate,
  deleteAccountValidation,
  validate,
  deleteMyAccount
);

router.get('/me/activity', authenticate, paginationValidation, validate, getMyActivity);

export default router;
