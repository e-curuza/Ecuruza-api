import { Router } from 'express';
import {
  register,
  login,
  registerCustomer,
  registerSeller,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getGoogleAuthUrlController,
  googleCallback,
  resendVerificationCode,
  verifyEmail,
  logout,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { uploadAvatar } from '../middlewares/multer.js';
import {
  registerValidation,
  loginValidation,
  customerRegisterValidation,
  sellerRegisterValidation,
  refreshTokenValidation,
  changePasswordValidation,
  updateProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  validate,
} from '../middlewares/validations/auth.validate.js';

const router = Router();

// General authentication routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// Customer registration
router.post('/register/customer', customerRegisterValidation, validate, registerCustomer);

// Seller registration
router.post('/register/seller', sellerRegisterValidation, validate, registerSeller);

router.post('/refresh', refreshTokenValidation, validate, refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.get('/google', getGoogleAuthUrlController);
router.get('/google/callback', googleCallback);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, uploadAvatar.single('avatar'), updateProfileValidation, validate, updateProfile);
router.post(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  changePassword
);
router.post('/verify-email', verifyEmailValidation, validate, verifyEmail);
router.post('/resend-verification', resendVerificationValidation, validate, resendVerificationCode);
router.post('/logout', authenticate, logout);

export default router;
