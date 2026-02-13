import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import { uploadAvatarToR2 } from '../utils/avatar.generate.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import type { UserResponse } from '../utils/type.js';

const prisma = new PrismaClient();

function formatUserResponse(user: any): UserResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
    ...(user.bio && { bio: user.bio }),
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
  };
}

export async function getAllUsers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, role, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (typeof search === 'string') {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (typeof role === 'string') where.role = role;
    if (typeof status === 'string') where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          avatarUrl: true, bio: true, role: true, status: true,
          emailVerified: true, phoneVerified: true, lastLoginAt: true,
          createdAt: true, updatedAt: true,
          seller: { select: { id: true, businessName: true, verificationStatus: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const response = ApiResponseBuilder.paginated<UserResponse>(
      'Users retrieved successfully',
      users.map(formatUserResponse),
      { page: pageNum, limit: limitNum, totalItems: total }
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (Array.isArray(id)) throw createError(400, 'Invalid user ID');

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        avatarUrl: true, bio: true, role: true, status: true,
        emailVerified: true, phoneVerified: true, lastLoginAt: true,
        createdAt: true, updatedAt: true,
        seller: { select: { id: true, businessName: true, businessType: true, businessAddress: true, verificationStatus: true, commissionRate: true, createdAt: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!user) throw createError(404, 'User not found');

    const response = ApiResponseBuilder.success('User retrieved successfully', formatUserResponse(user));
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (Array.isArray(id)) throw createError(400, 'Invalid user ID');

    const { firstName, lastName, phone, bio, role, status } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw createError(404, 'User not found');

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedUser = await prisma.user.update({ where: { id }, data: updateData });

    logger.info(`User updated by admin: ${id}`);
    const response = ApiResponseBuilder.success('User updated successfully', formatUserResponse(updatedUser));
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (Array.isArray(id)) throw createError(400, 'Invalid user ID');

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw createError(404, 'User not found');

    await prisma.user.update({ where: { id }, data: { status: 'DELETED' } });

    logger.info(`User soft deleted: ${id}`);
    const response = ApiResponseBuilder.success('User deleted successfully');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function suspendUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (Array.isArray(id)) throw createError(400, 'Invalid user ID');
    const { reason } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw createError(404, 'User not found');
    if (existingUser.status === 'SUSPENDED') throw createError(400, 'User is already suspended');

    await prisma.user.update({ where: { id }, data: { status: 'SUSPENDED' } });

    await prisma.auditLog.create({
      data: { userId: id, action: 'USER_SUSPENDED', ip: req.ip || undefined },
    });

    logger.info(`User suspended: ${id}, reason: ${reason}`);
    const response = ApiResponseBuilder.success('User suspended successfully');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function activateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (Array.isArray(id)) throw createError(400, 'Invalid user ID');

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw createError(404, 'User not found');
    if (existingUser.status === 'ACTIVE') throw createError(400, 'User is already active');

    await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });

    await prisma.auditLog.create({
      data: { userId: id, action: 'USER_ACTIVATED', ip: req.ip || undefined },
    });

    logger.info(`User activated: ${id}`);
    const response = ApiResponseBuilder.success('User activated successfully');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        seller: { select: { id: true, businessName: true, businessType: true, businessAddress: true, verificationStatus: true, commissionRate: true } },
        _count: { select: { orders: true, reviews: true, addresses: true } },
      },
    });

    if (!dbUser) throw createError(404, 'User not found');

    const profile = {
      ...formatUserResponse(dbUser),
      seller: dbUser.seller,
      stats: { totalOrders: dbUser._count.orders, totalReviews: dbUser._count.reviews, totalAddresses: dbUser._count.addresses },
    };

    const response = ApiResponseBuilder.success('Profile retrieved successfully', profile);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { firstName, lastName, phone, bio } = req.body;
    const avatarFile = req.file;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    if (avatarFile) {
      const avatarUrl = await uploadAvatarToR2(avatarFile.buffer, avatarFile.originalname, userId);
      updateData.avatarUrl = avatarUrl;
    }

    const updatedUser = await prisma.user.update({ where: { id: userId }, data: updateData });

    logger.info(`User profile updated: ${userId}`);
    const response = ApiResponseBuilder.success('Profile updated successfully', formatUserResponse(updatedUser));
    res.json(response);
  } catch (error) {
    next(error);
  }
}


export async function getMyAddresses(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const addresses = await prisma.address.findMany({
      where: { userId: userPayload.userId },
      orderBy: { isDefault: 'desc' },
    });
    const response = ApiResponseBuilder.success('Addresses retrieved successfully', addresses);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function createAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { address, city, street, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }

    const existingAddresses = await prisma.address.count({ where: { userId } });
    const newAddress = await prisma.address.create({
      data: { userId, address, city, street, isDefault: isDefault || existingAddresses === 0 },
    });

    logger.info(`Address created for user: ${userId}`);
    const response = ApiResponseBuilder.created('Address created successfully', newAddress);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;
    const { address, city, street, isDefault } = req.body;

    if (Array.isArray(id)) throw createError(400, 'Invalid address ID');

    const existingAddress = await prisma.address.findFirst({ where: { id, userId } });
    if (!existingAddress) throw createError(404, 'Address not found');

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }

    const updatedAddress = await prisma.address.update({ where: { id }, data: { address, city, street, isDefault } });
    const response = ApiResponseBuilder.success('Address updated successfully', updatedAddress);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;

    if (Array.isArray(id)) throw createError(400, 'Invalid address ID');

    const existingAddress = await prisma.address.findFirst({ where: { id, userId } });
    if (!existingAddress) throw createError(404, 'Address not found');

    await prisma.address.delete({ where: { id } });
    const response = ApiResponseBuilder.success('Address deleted successfully');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function setDefaultAddress(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;

    if (Array.isArray(id)) throw createError(400, 'Invalid address ID');

    const existingAddress = await prisma.address.findFirst({ where: { id, userId } });
    if (!existingAddress) throw createError(404, 'Address not found');

    await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    await prisma.address.update({ where: { id }, data: { isDefault: true } });

    const response = ApiResponseBuilder.success('Address set as default');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyOrders(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (typeof status === 'string') where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { id: true, name: true, basePrice: true } } } },
          payments: { select: { id: true, status: true, amount: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const response = ApiResponseBuilder.paginated('Orders retrieved successfully', orders, { page: pageNum, limit: limitNum, totalItems: total });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyOrderById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;

    if (Array.isArray(id)) throw createError(400, 'Invalid order ID');

    const order = await prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, description: true, basePrice: true, images: { select: { imageUrl: true, isPrimary: true }, take: 1 } } } } },
        payments: true,
      },
    });

    if (!order) throw createError(404, 'Order not found');

    const response = ApiResponseBuilder.success('Order retrieved successfully', order);
    res.json(response);
  } catch (error) {
    next(error);
  }
}


export async function getMyReviews(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { id: true, name: true, basePrice: true, images: { select: { imageUrl: true }, take: 1 } } } },
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    const response = ApiResponseBuilder.paginated('Reviews retrieved successfully', reviews, { page: pageNum, limit: limitNum, totalItems: total });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const response: any = ApiResponseBuilder.success('Notifications retrieved successfully', notifications);
    response.pagination = { currentPage: pageNum, itemsPerPage: limitNum, totalItems: total, totalPages: Math.ceil(total / limitNum), hasNextPage: pageNum < Math.ceil(total / limitNum), hasPreviousPage: pageNum > 1 };
    response.unreadCount = unreadCount;
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;

    if (Array.isArray(id)) throw createError(400, 'Invalid notification ID');

    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw createError(404, 'Notification not found');

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    const response = ApiResponseBuilder.success('Notification marked as read');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    await prisma.notification.updateMany({ where: { userId: userPayload.userId, isRead: false }, data: { isRead: true } });
    const response = ApiResponseBuilder.success('All notifications marked as read');
    res.json(response);
  } catch (error) {
    next(error);
  }
}


export async function getMyMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (unreadOnly === 'true') where.isRead = false;

    const [messages, total, unreadCount] = await Promise.all([
      prisma.message.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
      prisma.message.count({ where }),
      prisma.message.count({ where: { userId, isRead: false } }),
    ]);

    const response: any = ApiResponseBuilder.success('Messages retrieved successfully', messages);
    response.pagination = { currentPage: pageNum, itemsPerPage: limitNum, totalItems: total, totalPages: Math.ceil(total / limitNum), hasNextPage: pageNum < Math.ceil(total / limitNum), hasPreviousPage: pageNum > 1 };
    response.unreadCount = unreadCount;
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function markMessageRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;

    if (Array.isArray(id)) throw createError(400, 'Invalid message ID');

    const message = await prisma.message.findFirst({ where: { id, userId } });
    if (!message) throw createError(404, 'Message not found');

    await prisma.message.update({ where: { id }, data: { isRead: true } });
    const response = ApiResponseBuilder.success('Message marked as read');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getPublicProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (Array.isArray(id)) throw createError(400, 'Invalid user ID');

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true, bio: true, role: true, status: true, createdAt: true,
        seller: { select: { id: true, businessName: true, businessType: true, verificationStatus: true } },
      },
    });

    if (!user) throw createError(404, 'User not found');
    if (user.status === 'DELETED') throw createError(404, 'User not found');

    const publicProfile = { id: user.id, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl, bio: user.bio, role: user.role, memberSince: user.createdAt, seller: user.seller };
    const response = ApiResponseBuilder.success('Public profile retrieved', publicProfile);
    res.json(response);
  } catch (error) {
    next(error);
  }
}


export async function deleteMyAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { password, reason } = req.body;

    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!dbUser) throw createError(404, 'User not found');

    await prisma.auditLog.create({ data: { userId, action: 'ACCOUNT_DELETED', ip: req.ip || undefined } });

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED', email: `deleted_${Date.now()}_${dbUser.email}`, phone: `deleted_${Date.now()}` },
    });

    logger.info(`User deleted own account: ${userId}`);
    const response = ApiResponseBuilder.success('Account deleted successfully');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { limit = 20 } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));

    const logResults = await prisma.auditLog.findMany({ where: { userId }, take: limitNum, orderBy: { createdAt: 'desc' } });
    const orderResults = await prisma.order.findMany({ where: { userId }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, total: true, createdAt: true } });
    const reviewResults = await prisma.review.findMany({ where: { userId }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, rating: true, createdAt: true, product: { select: { name: true } } } });

    const activity = { recentAuditLogs: logResults, recentOrders: orderResults, recentReviews: reviewResults };
    const response = ApiResponseBuilder.success('Activity retrieved', activity);
    res.json(response);
  } catch (error) {
    next(error);
  }
}
