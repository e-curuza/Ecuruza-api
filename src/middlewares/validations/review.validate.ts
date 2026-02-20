import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import createError from 'http-errors';

// Middleware to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw createError(400, errorMessages.join(', '));
  }
  next();
};

// Create review validation
export const createReviewValidation = [
  body('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Invalid product ID format'),

  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),

  handleValidationErrors,
];

// Update review validation
export const updateReviewValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid review ID format'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),

  handleValidationErrors,
];

// Delete review validation
export const deleteReviewValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid review ID format'),

  handleValidationErrors,
];

// Get reviews by product validation
export const getReviewsByProductValidation = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID format'),

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
    .isIn(['createdAt', 'updatedAt', 'rating'])
    .withMessage('Sort by must be createdAt, updatedAt, or rating'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  handleValidationErrors,
];

// Get reviews by user validation
export const getReviewsByUserValidation = [
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
    .isIn(['createdAt', 'updatedAt', 'rating'])
    .withMessage('Sort by must be createdAt, updatedAt, or rating'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  handleValidationErrors,
];

// Get product rating summary validation
export const getProductRatingSummaryValidation = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID format'),

  handleValidationErrors,
];