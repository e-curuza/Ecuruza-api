import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import type { SellerResponse, SellerApplicationResponse, SellerFilters } from '../utils/type.js';

 

export const sellerOnboardSubmitBusiness = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { businessName, businessType, taxId, country, city, businessAddress } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw createError(404, 'User not found');

    const existingSeller = await prisma.seller.findUnique({ where: { userId } });
    if (existingSeller) throw createError(400, 'You are already a seller');

    const existingApplication = await prisma.sellerApplication.findFirst({
      where: { userId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    });
    if (existingApplication) throw createError(400, 'You already have a pending application');

    const idCardUrl = files?.idCard?.[0]?.path;
    const businessCertUrl = files?.businessCert?.[0]?.path;

    const application = await prisma.sellerApplication.create({
      data: {
        userId,
        businessName,
        businessType,
        taxId,
        country,
        city,
        businessAddress,
        idCardUrl,
      },
    });

    logger.info(`Seller application submitted: ${userId}`);
    const response = ApiResponseBuilder.created('Seller application submitted successfully', {
      id: application.id,
      businessName: application.businessName,
      businessType: application.businessType,
      country: application.country,
      city: application.city,
      status: application.status,
      createdAt: application.createdAt,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export const sellerOnboardGetMyBusiness = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    const application = await prisma.sellerApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      const response = ApiResponseBuilder.success('No application found', null);
      res.json(response);
      return;
    }

    const response = ApiResponseBuilder.success('Application retrieved', application);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export const sellerOnboardGetAllBusinesses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (typeof status === 'string' && status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.sellerApplication.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      }),
      prisma.sellerApplication.count({ where }),
    ]);

    const response = ApiResponseBuilder.paginated(
      'Applications retrieved successfully',
      applications,
      { page: pageNum, limit: limitNum, totalItems: total }
    );
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export const sellerOnboardGetBusinessById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const application = await prisma.sellerApplication.findUnique({
      where: { id: id as string },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
      },
    });

    if (!application) throw createError(404, 'Application not found');

    const response = ApiResponseBuilder.success('Application retrieved', application);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export const sellerOnboardApproveBusiness = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = (req as any).user;
    const adminId = userPayload.userId;
    const { id } = req.params;
    const { status, adminMessage } = req.body;

    const application = await prisma.sellerApplication.findUnique({ where: { id: id as string } });
    if (!application) throw createError(404, 'Application not found');
    if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
      throw createError(400, 'Application has already been reviewed');
    }

    const updatedApplication = await prisma.sellerApplication.update({
      where: { id: id as string },
      data: {
        status,
        adminMessage,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    if (status === 'APPROVED') {
      // Check if seller already exists to prevent duplicates
      const existingSeller = await prisma.seller.findUnique({ where: { userId: application.userId } });
      if (!existingSeller) {
        await prisma.seller.create({
          data: {
            userId: application.userId,
            businessName: application.businessName,
            businessType: application.businessType,
            businessAddress: application.businessAddress,
            verificationStatus: 'VERIFIED',
            commissionRate: 0.1,
          },
        });
      }

      // Update user role to SELLER if not already
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: 'SELLER' },
      });
    }

    logger.info(`Seller application reviewed: ${id} by ${adminId}, status: ${status}`);
    const response = ApiResponseBuilder.success('Application reviewed successfully', {
      id: updatedApplication.id,
      status: updatedApplication.status,
      adminMessage: updatedApplication.adminMessage,
      reviewedAt: updatedApplication.reviewedAt,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export const sellerUpdateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { bio, phone, firstName, lastName } = req.body;
    const avatarFile = req.file;

    // Update user profile information
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;

    if (avatarFile) {
      const { uploadAvatarToR2 } = await import('../utils/avatar.generate.js');
      const avatarUrl = await uploadAvatarToR2(avatarFile.buffer, avatarFile.originalname, userId);
      updateData.avatarUrl = avatarUrl;
    } else if (firstName || lastName) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (currentUser) {
        try {
          const { generateAndUploadAvatar } = await import('../utils/avatar.generate.js');
          const newAvatarUrl = await generateAndUploadAvatar(
            firstName || currentUser.firstName,
            lastName || currentUser.lastName,
            userId
          );
          updateData.avatarUrl = newAvatarUrl;
        } catch (avatarError) {
          logger.warn('Failed to regenerate avatar:', avatarError);
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Get updated seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        shops: { select: { id: true, name: true, slug: true, logoUrl: true, status: true, rating: true, _count: { select: { products: true } } } },
        subscriptions: { where: { status: 'ACTIVE' }, select: { id: true, plan: true, duration: true, status: true, createdAt: true } },
        _count: { select: { ads: true, shops: true } },
      },
    });

    const userResponse = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      ...(updatedUser.avatarUrl && { avatarUrl: updatedUser.avatarUrl }),
      ...((updatedUser as any).bio && { bio: (updatedUser as any).bio }),
      role: updatedUser.role,
      status: updatedUser.status,
      emailVerified: updatedUser.emailVerified,
      phoneVerified: updatedUser.phoneVerified,
      createdAt: updatedUser.createdAt,
    };

    const response = ApiResponseBuilder.success('Seller profile updated successfully', {
      user: userResponse,
      seller: seller,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export const sellerGetProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw createError(404, 'User not found');

    // Get seller information
    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        shops: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            status: true,
            rating: true,
            description: true,
            _count: { select: { products: true } }
          }
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            plan: true,
            duration: true,
            status: true,
            createdAt: true
          }
        },
        _count: { select: { ads: true, shops: true } },
      },
    }) as any;

    if (!seller) throw createError(404, 'Seller profile not found');

    // Calculate some basic statistics
    const totalProducts = seller.shops.reduce((sum: number, shop: any) => sum + shop._count.products, 0);
    const totalOrders = 0; // TODO: Calculate from products or orders table

    const profile = {
      user,
      seller: {
        id: seller.id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        businessAddress: seller.businessAddress,
        verificationStatus: seller.verificationStatus,
        commissionRate: seller.commissionRate,
        createdAt: seller.createdAt,
      },
      statistics: {
        totalShops: seller._count.shops,
        totalProducts,
        totalOrders,
        activeAds: seller._count.ads,
        activeSubscriptions: seller.subscriptions.length,
      },
      shops: seller.shops,
      subscriptions: seller.subscriptions,
    };

    const response = ApiResponseBuilder.success('Seller profile retrieved successfully', profile);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export const sellerDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    // Get seller information
    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: { id: true, businessName: true, commissionRate: true }
    });

    if (!seller) throw createError(404, 'Seller not found');

    // Get all shops for this seller
    const shops = await prisma.shop.findMany({
      where: { sellerId: seller.id },
      select: {
        id: true,
        name: true,
        status: true,
        rating: true,
        _count: { select: { products: true } }
      }
    });

    const shopIds = shops.map(shop => shop.id);

    // Calculate total products
    const totalProducts = await prisma.product.count({
      where: { shopId: { in: shopIds } }
    });

    // Calculate total orders and revenue
    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          shopId: { in: shopIds }
        }
      },
      include: {
        order: {
          select: { status: true, createdAt: true }
        }
      }
    });

    const totalOrders = orderItems.length;
    const totalRevenue = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await prisma.orderItem.findMany({
      where: {
        product: {
          shopId: { in: shopIds }
        },
        order: {
          createdAt: { gte: thirtyDaysAgo }
        }
      },
      include: {
        order: {
          select: { id: true, status: true, createdAt: true, user: { select: { firstName: true, lastName: true } } }
        },
        product: {
          select: { name: true, shop: { select: { name: true } } }
        }
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: 10
    });

    // Get low stock alerts (products with stock < 10)
    const lowStockProducts = await prisma.productVariant.findMany({
      where: {
        product: {
          shopId: { in: shopIds }
        },
        stock: { lt: 10 }
      },
      include: {
        product: {
          select: { name: true, shop: { select: { name: true } } }
        }
      },
      orderBy: { stock: 'asc' },
      take: 10
    });

    // Get active ads count
    const activeAds = await prisma.sponsoredAd.count({
      where: {
        sellerId: seller.id,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    });

    // Get recent reviews
    const recentReviews = await prisma.review.findMany({
      where: {
        product: {
          shopId: { in: shopIds }
        }
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        product: { select: { name: true, shop: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get monthly stats (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyOrderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          shopId: { in: shopIds }
        },
        order: {
          createdAt: { gte: currentMonth }
        }
      }
    });

    const monthlyRevenue = monthlyOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const monthlyOrders = monthlyOrderItems.length;

    const dashboard = {
      overview: {
        totalShops: shops.length,
        totalProducts,
        totalOrders,
        totalRevenue,
        activeAds,
        averageRating: shops.length > 0 ? shops.reduce((sum, shop) => sum + (shop.rating || 0), 0) / shops.length : 0
      },
      monthlyStats: {
        orders: monthlyOrders,
        revenue: monthlyRevenue
      },
      recentOrders: recentOrders.map(item => ({
        orderId: item.order.id,
        customerName: `${item.order.user.firstName} ${item.order.user.lastName}`,
        productName: item.product.name,
        shopName: item.product.shop.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        status: item.order.status,
        date: item.order.createdAt
      })),
      lowStockAlerts: lowStockProducts.map(variant => ({
        productName: variant.product.name,
        shopName: variant.product.shop.name,
        stock: variant.stock,
        sku: variant.sku
      })),
      recentReviews: recentReviews.map(review => ({
        customerName: `${review.user.firstName} ${review.user.lastName}`,
        productName: review.product.name,
        shopName: review.product.shop.name,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt
      }))
    };

    const response = ApiResponseBuilder.success('Seller dashboard retrieved successfully', dashboard);
    res.json(response);
  } catch (error) {
    next(error);
  }
}
