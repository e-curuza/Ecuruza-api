import { Router } from 'express';
import {
  getOrderItems,
  getOrderItem,
  updateOrderItem,
  deleteOrderItem,
} from '../controllers/order-item.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  getOrderItemsValidation,
  getOrderItemValidation,
  updateOrderItemValidation,
  deleteOrderItemValidation,
} from '../middlewares/validations/order-item.validate.js';

const router = Router();

router.get('/order/:orderId', authenticate, getOrderItemsValidation, getOrderItems);
router.get('/:id', authenticate, getOrderItemValidation, getOrderItem);
router.put('/:id', authenticate, updateOrderItemValidation, updateOrderItem);
router.delete('/:id', authenticate, deleteOrderItemValidation, deleteOrderItem);

export default router;
