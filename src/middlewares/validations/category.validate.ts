import type { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import createError from 'http-errors';

export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),
];

export const updateCategoryValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),
];

export const categoryIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid category ID'),
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