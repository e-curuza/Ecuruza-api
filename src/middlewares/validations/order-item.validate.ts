import type { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import createError from 'http-errors';

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw createError(400, errorMessages.join(', '));
  }
  next();
};

export const getOrderItemsValidation = [
  param('orderId')
    .isUUID()
    .withMessage('Invalid order ID'),
  handleValidationErrors,
];

export const getOrderItemValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order item ID'),
  handleValidationErrors,
];

export const updateOrderItemValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order item ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidationErrors,
];

export const deleteOrderItemValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order item ID'),
  handleValidationErrors,
];
