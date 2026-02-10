import { Router } from 'express';
import {
  register,
  login,
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
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  updateProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  validate,
} from '../middlewares/validations/auth.validate';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refreshTokenValidation, validate, refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.get('/google', getGoogleAuthUrlController);
router.get('/google/callback', googleCallback);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, validate, updateProfile);
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
