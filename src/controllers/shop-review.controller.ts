import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import type { ShopReviewResponse } from '../utils/type.js';

function formatShopReviewResponse(review: any): ShopReviewResponse {
  return {
    id: review.id,
    userId: review.userId,
    shopId: review.shopId,
    rating: review.rating,
    ...(review.comment && { comment: review.comment }),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    ...(review.user && {
      user: {
        firstName: review.user.firstName,
        lastName: review.user.lastName,
        ...(review.user.avatarUrl && { avatarUrl: review.user.avatarUrl }),
      },
    }),
  };
}

export const createShopReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shopId, rating, comment } = req.body;
    const userId = req.user!.userId;

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw createError(400, 'Rating must be between 1 and 5');
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId as string },
    });

    if (!shop) {
      throw createError(404, 'Shop not found');
    }

    // Check if user has already reviewed this shop
    const existingReview = await prisma.shopReview.findFirst({
      where: {
        userId,
        shopId: shopId as string,
      },
    });

    if (existingReview) {
      throw createError(400, 'You have already reviewed this shop');
    }

    // Check if user has ordered from this shop (optional, but good practice)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        order: {
          userId,
          status: { in: ['DELIVERED', 'SHIPPED'] },
        },
        product: {
          shopId: shopId as string,
        },
      },
    });

    if (!hasPurchased) {
      throw createError(400, 'You can only review shops you have purchased from');
    }

    const review = await prisma.shopReview.create({
      data: {
        userId,
        shopId: shopId as string,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update shop rating
    const allReviews = await prisma.shopReview.findMany({
      where: { shopId: shopId as string },
      select: { rating: true },
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await prisma.shop.update({
      where: { id: shopId as string },
      data: {
        rating: averageRating,
        ratingCount: allReviews.length,
      },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Shop review created successfully')
      .setData(formatShopReviewResponse(review))
      .build();

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating shop review:', error);
    next(error);
  }
}

export const getShopReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where: { shopId: shopId as string },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.shopReview.count({
        where: { shopId: shopId as string },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const response = new ApiResponseBuilder()
      .setMessage('Shop reviews retrieved successfully')
      .setData({
        reviews: reviews.map(formatShopReviewResponse),
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
    logger.error('Error getting shop reviews:', error);
    next(error);
  }
}

export const getShopReviewsByUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.shopReview.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.shopReview.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const response = new ApiResponseBuilder()
      .setMessage('User shop reviews retrieved successfully')
      .setData({
        reviews: reviews.map(formatShopReviewResponse),
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
    logger.error('Error getting user shop reviews:', error);
    next(error);
  }
}

export const updateShopReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.userId;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw createError(400, 'Rating must be between 1 and 5');
    }

    const review = await prisma.shopReview.findFirst({
      where: {
        id: id as string,
        userId,
      },
    });

    if (!review) {
      throw createError(404, 'Review not found or you do not have permission to update it');
    }

    const updatedReview = await prisma.shopReview.update({
      where: { id: id as string },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update shop rating if rating changed
    if (rating !== undefined) {
      const allReviews = await prisma.shopReview.findMany({
        where: { shopId: review.shopId },
        select: { rating: true },
      });

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      await prisma.shop.update({
        where: { id: review.shopId },
        data: {
          rating: averageRating,
          ratingCount: allReviews.length,
        },
      });
    }

    const response = new ApiResponseBuilder()
      .setMessage('Shop review updated successfully')
      .setData(formatShopReviewResponse(updatedReview))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error updating shop review:', error);
    next(error);
  }
}

export const deleteShopReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const review = await prisma.shopReview.findFirst({
      where: {
        id: id as string,
        userId,
      },
    });

    if (!review) {
      throw createError(404, 'Review not found or you do not have permission to delete it');
    }

    const shopId = review.shopId;

    await prisma.shopReview.delete({
      where: { id: id as string },
    });

    // Update shop rating
    const allReviews = await prisma.shopReview.findMany({
      where: { shopId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      await prisma.shop.update({
        where: { id: shopId },
        data: {
          rating: averageRating,
          ratingCount: allReviews.length,
        },
      });
    } else {
      await prisma.shop.update({
        where: { id: shopId },
        data: {
          rating: null,
          ratingCount: 0,
        },
      });
    }

    const response = new ApiResponseBuilder()
      .setMessage('Shop review deleted successfully')
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error deleting shop review:', error);
    next(error);
  }
}

export const getShopRatingSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shopId } = req.params;

    const reviews = await prisma.shopReview.findMany({
      where: { shopId: shopId as string },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      const response = new ApiResponseBuilder()
        .setMessage('No reviews found for this shop')
        .setData({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        })
        .build();

      res.json(response);
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating as keyof typeof dist] = (dist[review.rating as keyof typeof dist] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    const response = new ApiResponseBuilder()
      .setMessage('Shop rating summary retrieved successfully')
      .setData({
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution,
      })
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error getting shop rating summary:', error);
    next(error);
  }
}
