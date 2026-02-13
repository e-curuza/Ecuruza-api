import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import { r2Service } from '../services/r2.service.js';

const prisma = new PrismaClient();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createShop(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(403, 'You must be a registered seller to create a shop');

    const { name, description, phone, email, address, returnPolicy, shippingPolicy, facebookUrl, twitterUrl, instagramUrl, linkedinUrl, youtubeUrl, tiktokUrl } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const existingShop = await prisma.shop.findFirst({ where: { sellerId: seller.id } });
    if (existingShop) throw createError(400, 'You already have a shop. Please edit your existing shop');

    const slug = generateSlug(name);
    const existingSlug = await prisma.shop.findUnique({ where: { slug } });
    if (existingSlug) throw createError(400, 'Shop name already exists. Please choose a different name');

    let logoUrl: string | null = null;
    let bannerUrl: string | null = null;

    if (files?.logo?.[0]) {
      const logoResult = await r2Service.uploadFile(files.logo[0].buffer, {
        folder: `shops/${seller.id}`,
        filename: `logo-${Date.now()}`,
        contentType: files.logo[0].mimetype,
      });
      logoUrl = logoResult.url;
    }

    if (files?.banner?.[0]) {
      const bannerResult = await r2Service.uploadFile(files.banner[0].buffer, {
        folder: `shops/${seller.id}`,
        filename: `banner-${Date.now()}`,
        contentType: files.banner[0].mimetype,
      });
      bannerUrl = bannerResult.url;
    }

    const shop = await prisma.shop.create({
      data: {
        sellerId: seller.id,
        name,
        slug,
        description,
        phone,
        email,
        address,
        returnPolicy,
        shippingPolicy,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        linkedinUrl,
        youtubeUrl,
        tiktokUrl,
        logoUrl,
        bannerUrl,
        status: 'PENDING',
      },
    });

    logger.info(`Shop created: ${shop.id} by user ${userId}`);
    const response = ApiResponseBuilder.created('Shop created successfully', {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      logoUrl: shop.logoUrl,
      bannerUrl: shop.bannerUrl,
      status: shop.status,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateShop(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(403, 'You must be a registered seller');

    const shop = await prisma.shop.findUnique({ where: { id: id as string } });
    if (!shop) throw createError(404, 'Shop not found');
    if (shop.sellerId !== seller.id) throw createError(403, 'You can only update your own shop');

    const { name, description, phone, email, address, returnPolicy, shippingPolicy, facebookUrl, twitterUrl, instagramUrl, linkedinUrl, youtubeUrl, tiktokUrl } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let logoUrl = shop.logoUrl;
    let bannerUrl = shop.bannerUrl;

    if (files?.logo?.[0]) {
      if (shop.logoUrl) await r2Service.deleteFile(shop.logoUrl);
      const logoResult = await r2Service.uploadFile(files.logo[0].buffer, {
        folder: `shops/${seller.id}`,
        filename: `logo-${Date.now()}`,
        contentType: files.logo[0].mimetype,
      });
      logoUrl = logoResult.url;
    }

    if (files?.banner?.[0]) {
      if (shop.bannerUrl) await r2Service.deleteFile(shop.bannerUrl);
      const bannerResult = await r2Service.uploadFile(files.banner[0].buffer, {
        folder: `shops/${seller.id}`,
        filename: `banner-${Date.now()}`,
        contentType: files.banner[0].mimetype,
      });
      bannerUrl = bannerResult.url;
    }

    let slug = shop.slug;
    if (name && name !== shop.name) {
      const newSlug = generateSlug(name);
      const existingSlug = await prisma.shop.findUnique({ where: { slug: newSlug } });
      if (existingSlug && existingSlug.id !== shop.id) {
        throw createError(400, 'Shop name already exists. Please choose a different name');
      }
      slug = newSlug;
    }

    const updatedShop = await prisma.shop.update({
      where: { id: id as string },
      data: {
        name: name || shop.name,
        slug,
        description: description ?? shop.description,
        phone: phone ?? shop.phone,
        email: email ?? shop.email,
        address: address ?? shop.address,
        returnPolicy: returnPolicy ?? shop.returnPolicy,
        shippingPolicy: shippingPolicy ?? shop.shippingPolicy,
        facebookUrl: facebookUrl ?? shop.facebookUrl,
        twitterUrl: twitterUrl ?? shop.twitterUrl,
        instagramUrl: instagramUrl ?? shop.instagramUrl,
        linkedinUrl: linkedinUrl ?? shop.linkedinUrl,
        youtubeUrl: youtubeUrl ?? shop.youtubeUrl,
        tiktokUrl: tiktokUrl ?? shop.tiktokUrl,
        logoUrl,
        bannerUrl,
      },
    });

    logger.info(`Shop updated: ${id} by user ${userId}`);
    const response = ApiResponseBuilder.success('Shop updated successfully', {
      id: updatedShop.id,
      name: updatedShop.name,
      slug: updatedShop.slug,
      logoUrl: updatedShop.logoUrl,
      bannerUrl: updatedShop.bannerUrl,
      status: updatedShop.status,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyShop(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(403, 'You must be a registered seller');

    const shop = await prisma.shop.findFirst({
      where: { sellerId: seller.id },
      include: {
        _count: { select: { products: true, ads: true } },
      },
    });

    if (!shop) throw createError(404, 'Shop not found');

    const response = ApiResponseBuilder.success('Shop retrieved', shop);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getShopById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({
      where: { id: id as string },
      include: {
        seller: { select: { id: true, businessName: true, user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        products: { where: { status: 'ACTIVE', visibility: 'PUBLIC' }, select: { id: true, name: true, basePrice: true, images: { take: 1 }, _count: true }, take: 10 },
        _count: { select: { products: true } },
      },
    });

    if (!shop) throw createError(404, 'Shop not found');

    const response = ApiResponseBuilder.success('Shop retrieved', shop);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getShopBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;

    const shop = await prisma.shop.findUnique({
      where: { slug: slug as string },
      include: {
        seller: { select: { id: true, businessName: true, user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        products: { where: { status: 'ACTIVE', visibility: 'PUBLIC' }, select: { id: true, name: true, basePrice: true, discount: true, images: { take: 1 }, _count: true }, take: 20 },
        _count: { select: { products: true } },
      },
    });

    if (!shop) throw createError(404, 'Shop not found');

    const response = ApiResponseBuilder.success('Shop retrieved', shop);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteShop(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(403, 'You must be a registered seller');

    const shop = await prisma.shop.findUnique({ where: { id: id as string } });
    if (!shop) throw createError(404, 'Shop not found');
    if (shop.sellerId !== seller.id) throw createError(403, 'You can only delete your own shop');

    if (shop.logoUrl) await r2Service.deleteFile(shop.logoUrl);
    if (shop.bannerUrl) await r2Service.deleteFile(shop.bannerUrl);

    await prisma.shop.delete({ where: { id: id as string } });

    logger.info(`Shop deleted: ${id} by user ${userId}`);
    const response = ApiResponseBuilder.success('Shop deleted successfully', null);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getAllShops(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const shops = await prisma.shop.findMany({
      where: { status: 'ACTIVE' },
      include: {
        seller: { select: { id: true, businessName: true, user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { products: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.shop.count({ where: { status: 'ACTIVE' } });

    const response = ApiResponseBuilder.success('Shops retrieved', {
      shops,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function incrementShopView(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const shop = await prisma.shop.findUnique({ where: { id: id as string } });
    if (!shop) throw createError(404, 'Shop not found');

    await prisma.shop.update({
      where: { id: id as string },
      data: { viewCount: { increment: 1 } },
    });

    const response = ApiResponseBuilder.success('View counted', { viewCount: shop.viewCount + 1 });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function addShopReview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const shop = await prisma.shop.findUnique({ where: { id: id as string } });
    if (!shop) throw createError(404, 'Shop not found');
    if (shop.status !== 'ACTIVE') throw createError(400, 'Cannot review inactive shop');

    if (rating < 1 || rating > 5) {
      throw createError(400, 'Rating must be between 1 and 5');
    }

    const existingReview = await prisma.shopReview.findFirst({
      where: { userId, shopId: id as string },
    });
    if (existingReview) {
      throw createError(400, 'You have already reviewed this shop');
    }

    const review = await prisma.shopReview.create({
      data: { userId, shopId: id as string, rating: Number(rating), comment },
    });

    const reviews = await prisma.shopReview.findMany({ where: { shopId: id as string } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.shop.update({
      where: { id: id as string },
      data: { rating: avgRating, ratingCount: reviews.length },
    });

    logger.info(`Shop review added: ${review.id} for shop ${id}`);
    const response = ApiResponseBuilder.created('Review added successfully', review);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getShopReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const shop = await prisma.shop.findUnique({ where: { id: id as string } });
    if (!shop) throw createError(404, 'Shop not found');

    const reviews = await prisma.shopReview.findMany({
      where: { shopId: id as string },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.shopReview.count({ where: { shopId: id as string } });

    const response = ApiResponseBuilder.success('Reviews retrieved', {
      reviews,
      rating: shop.rating,
      ratingCount: shop.ratingCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteShopReview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { id, reviewId } = req.params;

    const review = await prisma.shopReview.findUnique({ where: { id: reviewId as string } });
    if (!review) throw createError(404, 'Review not found');
    if (review.userId !== userId) throw createError(403, 'Not authorized to delete this review');

    await prisma.shopReview.delete({ where: { id: reviewId as string } });

    const reviews = await prisma.shopReview.findMany({ where: { shopId: id as string } });
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

    await prisma.shop.update({
      where: { id: id as string },
      data: { rating: avgRating, ratingCount: reviews.length },
    });

    logger.info(`Shop review deleted: ${reviewId}`);
    const response = ApiResponseBuilder.success('Review deleted successfully', null);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMyShopStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(403, 'You must be a registered seller');

    const shop = await prisma.shop.findFirst({
      where: { sellerId: seller.id },
      include: {
        _count: { select: { products: true, reviews: true, ads: true } },
        reviews: { select: { rating: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!shop) throw createError(404, 'Shop not found');

    const totalReviews = await prisma.shopReview.count({ where: { shopId: shop.id } });
    const averageRating = shop.rating;

    const stats = {
      viewCount: shop.viewCount,
      totalProducts: shop._count.products,
      totalReviews: totalReviews,
      averageRating: averageRating,
      ratingCount: shop.ratingCount,
      recentReviews: shop.reviews,
    };

    const response = ApiResponseBuilder.success('Shop stats retrieved', stats);
    res.json(response);
  } catch (error) {
    next(error);
  }
}
