import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import type { OrderItemResponse } from '../utils/type.js';

function formatOrderItemResponse(item: any): OrderItemResponse {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const getOrderItems = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const items = await prisma.orderItem.findMany({
      where: { orderId: orderId as string },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Order items retrieved successfully')
      .setData(items.map(formatOrderItemResponse))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error getting order items:', error);
    next(error);
  }
}

export const getOrderItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await prisma.orderItem.findUnique({
      where: { id: id as string },
      include: {
        product: {
          include: {
            images: true,
          },
        },
        order: true,
      },
    });

    if (!item) {
      throw createError(404, 'Order item not found');
    }

    const response = new ApiResponseBuilder()
      .setMessage('Order item retrieved successfully')
      .setData(formatOrderItemResponse(item))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error getting order item:', error);
    next(error);
  }
}

export const updateOrderItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await prisma.orderItem.findUnique({
      where: { id: id as string },
      include: {
        order: true,
      },
    });

    if (!item) {
      throw createError(404, 'Order item not found');
    }

    if (item.order.status !== 'PENDING' && item.order.status !== 'CONFIRMED') {
      throw createError(400, 'Cannot update order item at this stage');
    }

    if (quantity !== undefined && quantity < 1) {
      throw createError(400, 'Quantity must be at least 1');
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: id as string },
      data: { quantity },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Order item updated successfully')
      .setData(formatOrderItemResponse(updatedItem))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error updating order item:', error);
    next(error);
  }
}

export const deleteOrderItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await prisma.orderItem.findUnique({
      where: { id: id as string },
      include: {
        order: true,
      },
    });

    if (!item) {
      throw createError(404, 'Order item not found');
    }

    if (item.order.status !== 'PENDING' && item.order.status !== 'CONFIRMED') {
      throw createError(400, 'Cannot delete order item at this stage');
    }

    await prisma.orderItem.delete({
      where: { id: id as string },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Order item deleted successfully')
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error deleting order item:', error);
    next(error);
  }
}
