import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  createOrderValidation,
  getOrdersValidation,
  getOrderValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
} from '../middlewares/validations/order.validate.js';

const router = Router();

router.post('/', authenticate, createOrderValidation, createOrder);
router.get('/', authenticate, getOrdersValidation, getOrders);
router.get('/:id', authenticate, getOrderValidation, getOrder);
router.put('/:id/status', authenticate, updateOrderStatusValidation, updateOrderStatus);
router.delete('/:id', authenticate, cancelOrderValidation, cancelOrder);

export default router;
