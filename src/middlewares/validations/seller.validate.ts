import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import createError from 'http-errors';

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
    .withMessage('Business type must be INDIVIDUAL or COMPANY'),

  body('taxId')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Tax ID must be between 5 and 20 characters'),

  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),

  body('businessAddress')
    .trim()
    .notEmpty()
    .withMessage('Business address is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Business address must be between 10 and 200 characters'),
];

export const reviewSellerApplicationValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid application ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Status must be APPROVED or REJECTED'),

  body('adminMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin message cannot exceed 500 characters'),
];

export const sellerApplicationIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid application ID'),
];

export const updateSellerProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
];

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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