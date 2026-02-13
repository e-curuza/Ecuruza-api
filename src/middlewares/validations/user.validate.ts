import type { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import createError from 'http-errors';

// User management validations (admin)
export const createUserValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['CUSTOMER', 'SELLER', 'ADMIN'])
    .withMessage('Invalid role'),
];

export const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be at most 500 characters'),
  
  body('role')
    .optional()
    .isIn(['CUSTOMER', 'SELLER', 'ADMIN'])
    .withMessage('Invalid role'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'SUSPENDED', 'DELETED'])
    .withMessage('Invalid status'),
];

// Address validations
export const createAddressValidation = [
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 255 })
    .withMessage('Address must be at most 255 characters'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 100 })
    .withMessage('City must be at most 100 characters'),
  
  body('street')
    .trim()
    .notEmpty()
    .withMessage('Street is required')
    .isLength({ max: 255 })
    .withMessage('Street must be at most 255 characters'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
];

export const updateAddressValidation = [
  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must be at most 255 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be at most 100 characters'),
  
  body('street')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Street must be at most 255 characters'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
];

// Seller application validation
export const becomeSellerValidation = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('businessType')
    .notEmpty()
    .withMessage('Business type is required')
    .isIn(['INDIVIDUAL', 'COMPANY'])
    .withMessage('Business type must be either INDIVIDUAL or COMPANY'),
  
  body('businessAddress')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Business address must be at most 255 characters'),
];

export const sellerApplicationValidation = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('businessType')
    .notEmpty()
    .withMessage('Business type is required')
    .isIn(['INDIVIDUAL', 'COMPANY'])
    .withMessage('Business type must be either INDIVIDUAL or COMPANY'),
  
  body('taxId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tax ID must be at most 50 characters'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ max: 100 })
    .withMessage('Country must be at most 100 characters'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 100 })
    .withMessage('City must be at most 100 characters'),
  
  body('businessAddress')
    .trim()
    .notEmpty()
    .withMessage('Full business address is required')
    .isLength({ max: 255 })
    .withMessage('Business address must be at most 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid website URL'),
];

export const reviewSellerApplicationValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Status must be either APPROVED or REJECTED'),
  
  body('adminMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin message must be at most 500 characters'),
];

export const businessInfoValidation = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('businessType')
    .notEmpty()
    .withMessage('Business type is required')
    .isIn(['INDIVIDUAL', 'COMPANY'])
    .withMessage('Business type must be either INDIVIDUAL or COMPANY'),
  
  body('businessRegistrationNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Business registration number must be at most 50 characters'),
  
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ max: 100 })
    .withMessage('Country must be at most 100 characters'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 100 })
    .withMessage('City must be at most 100 characters'),
  
  body('fullBusinessAddress')
    .trim()
    .notEmpty()
    .withMessage('Full business address is required')
    .isLength({ max: 255 })
    .withMessage('Full business address must be at most 255 characters'),
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isString()
    .withMessage('sortBy must be a string'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
];

// Account deletion validation
export const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be at most 500 characters'),
];

// Suspension validation
export const suspendUserValidation = [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Suspension reason must be at most 500 characters'),
];

// Filter validations
export const userFiltersValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be at most 100 characters'),
  
  query('role')
    .optional()
    .isIn(['CUSTOMER', 'SELLER', 'ADMIN'])
    .withMessage('Invalid role filter'),
  
  query('status')
    .optional()
    .isIn(['ACTIVE', 'SUSPENDED', 'DELETED'])
    .withMessage('Invalid status filter'),
];

// Generic validation middleware
export function validate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.path,
      message: error.msg,
    }));
    
    next(createError(400, 'Validation failed', { details: formattedErrors }));
    return;
  }
  
  next();
}

// =====================
// SHOP VALIDATIONS
// =====================

export const createShopValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Shop name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must be at most 255 characters'),
  
  body('returnPolicy')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Return policy must be at most 2000 characters'),
  
  body('shippingPolicy')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Shipping policy must be at most 2000 characters'),
  
  body('facebookUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid Facebook URL'),
  
  body('twitterUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid Twitter URL'),
  
  body('instagramUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid Instagram URL'),
  
  body('linkedinUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL'),
  
  body('youtubeUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid YouTube URL'),
  
  body('tiktokUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid TikTok URL'),
];

export const updateShopValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Shop name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must be at most 255 characters'),
  
  body('returnPolicy')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Return policy must be at most 2000 characters'),
  
  body('shippingPolicy')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Shipping policy must be at most 2000 characters'),
  
  body('facebookUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid Facebook URL'),
  
  body('twitterUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid Twitter URL'),
  
  body('instagramUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid Instagram URL'),
  
  body('linkedinUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL'),
  
  body('youtubeUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid YouTube URL'),
  
  body('tiktokUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid TikTok URL'),
];

export const shopReviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must be at most 1000 characters'),
];
