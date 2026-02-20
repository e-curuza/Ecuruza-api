import type { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import createError from 'http-errors';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw createError(400, errorMessages.join(', '));
  }
  next();
};

export const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order items are required'),
  body('items.*.productId')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('items.*.variantId')
    .optional()
    .isUUID()
    .withMessage('Invalid variant ID'),
  handleValidationErrors,
];

export const getOrdersValidation = [
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
    .isIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];

export const getOrderValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
  handleValidationErrors,
];

export const updateOrderStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
  body('status')
    .isIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];

export const cancelOrderValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
  handleValidationErrors,
];
