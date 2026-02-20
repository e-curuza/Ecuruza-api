import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import type { OrderResponse, CreateOrderItemRequest } from '../utils/type.js';

function formatOrderResponse(order: any): OrderResponse {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    total: order.total,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items?.map((item: any) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price,
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        basePrice: item.product.basePrice,
        images: item.product.images?.map((img: any) => ({
          id: img.id,
          productId: img.productId,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
        })),
      } : undefined,
    })),
  };
}

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { items, shippingAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError(400, 'Order items are required');
    }

    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const { productId, variantId, quantity } = item as CreateOrderItemRequest;

      if (!productId || !quantity || quantity < 1) {
        throw createError(400, 'Invalid item data');
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw createError(404, `Product ${productId} not found`);
      }

      if (product.status !== 'ACTIVE') {
        throw createError(400, `Product ${product.name} is not available`);
      }

      let price = product.basePrice;

      if (variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
        });

        if (!variant) {
          throw createError(404, `Variant ${variantId} not found`);
        }

        if (variant.stock < quantity) {
          throw createError(400, `Insufficient stock for variant ${variant.sku}`);
        }

        price = variant.price;
      }

      if (product.discount) {
        price = price - (price * product.discount / 100);
      }

      total += price * quantity;

      orderItemsData.push({
        productId,
        variantId: variantId || null,
        quantity,
        price,
      });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        total,
        paymentStatus: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Order created successfully')
      .setData(formatOrderResponse(order))
      .build();

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating order:', error);
    next(error);
  }
}

export const getOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const response = new ApiResponseBuilder()
      .setMessage('Orders retrieved successfully')
      .setData({
        orders: orders.map(formatOrderResponse),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      })
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error getting orders:', error);
    next(error);
  }
}

export const getOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: id as string, userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw createError(404, 'Order not found');
    }

    const response = new ApiResponseBuilder()
      .setMessage('Order retrieved successfully')
      .setData(formatOrderResponse(order))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error getting order:', error);
    next(error);
  }
}

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: id as string },
    });

    if (!order) {
      throw createError(404, 'Order not found');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: id as string },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Order status updated successfully')
      .setData(formatOrderResponse(updatedOrder))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
}

export const cancelOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: id as string, userId },
    });

    if (!order) {
      throw createError(404, 'Order not found');
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw createError(400, 'Order cannot be cancelled');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: id as string },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Order cancelled successfully')
      .setData(formatOrderResponse(updatedOrder))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error cancelling order:', error);
    next(error);
  }
}

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw createError(404, 'Order not found');
    }

    const response = new ApiResponseBuilder()
      .setMessage('Order retrieved successfully')
      .setData(formatOrderResponse(order))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error getting order:', error);
    next(error);
  }
}
