import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import createError from 'http-errors';

export const createProductValidation = [
  body('shopId')
    .notEmpty()
    .withMessage('Shop ID is required')
    .isUUID()
    .withMessage('Invalid shop ID'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID()
    .withMessage('Invalid category ID'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),

  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK'])
    .withMessage('Invalid status'),

  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'HIDDEN'])
    .withMessage('Invalid visibility'),
];

export const updateProductValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),

  body('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK'])
    .withMessage('Invalid status'),

  body('visibility')
    .optional()
    .isIn(['PUBLIC', 'HIDDEN'])
    .withMessage('Invalid visibility'),

  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
];

export const productIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid product ID'),
];

export const shopIdValidation = [
  param('shopId')
    .isUUID()
    .withMessage('Invalid shop ID'),
];

export const getAllProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK'])
    .withMessage('Invalid status filter'),
];

export const getProductsByShopValidation = [
  param('shopId')
    .isUUID()
    .withMessage('Invalid shop ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK'])
    .withMessage('Invalid status filter'),
];

// ProductVariant validations
export const createProductVariantValidation = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID'),

  body('sku')
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU must be between 1 and 100 characters'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('attributes')
    .optional()
    .isObject()
    .withMessage('Attributes must be a valid JSON object'),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('lowStockAlert')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock alert must be a non-negative integer'),
];

export const variantIdValidation = [
  param('variantId')
    .isUUID()
    .withMessage('Invalid variant ID'),
];

export const updateProductVariantValidation = [
  param('variantId')
    .isUUID()
    .withMessage('Invalid variant ID'),

  body('sku')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU must be between 1 and 100 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('attributes')
    .optional()
    .isObject()
    .withMessage('Attributes must be a valid JSON object'),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('lowStockAlert')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock alert must be a non-negative integer'),
];

// Inventory validations
export const updateInventoryValidation = [
  param('variantId')
    .isUUID()
    .withMessage('Invalid variant ID'),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('lowStockAlert')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock alert must be a non-negative integer'),
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