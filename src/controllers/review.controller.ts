import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';
import type { ReviewResponse } from '../utils/type.js';

function formatReviewResponse(review: any): ReviewResponse {
  return {
    id: review.id,
    userId: review.userId,
    productId: review.productId,
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

export const createReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user!.userId;

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw createError(400, 'Rating must be between 1 and 5');
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw createError(404, 'Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      throw createError(400, 'You have already reviewed this product');
    }

    // Check if user has purchased the product (optional, but good practice)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        order: {
          userId,
          status: { in: ['DELIVERED', 'SHIPPED'] },
        },
        productId,
      },
    });

    if (!hasPurchased) {
      throw createError(400, 'You can only review products you have purchased');
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
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

    const response = new ApiResponseBuilder()
      .setMessage('Review created successfully')
      .setData(formatReviewResponse(review))
      .build();

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error creating review:', error);
    next(error);
  }
}

export const getReviewsByProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: productId as string },
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
      prisma.review.count({
        where: { productId: productId as string },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const response = new ApiResponseBuilder()
      .setMessage('Reviews retrieved successfully')
      .setData({
        reviews: reviews.map(formatReviewResponse),
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
    logger.error('Error getting reviews by product:', error);
    next(error);
  }
}

export const getReviewsByUser = async (
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
      prisma.review.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              images: {
                where: { isPrimary: true },
                select: { imageUrl: true },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.review.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const formattedReviews = reviews.map(review => ({
      ...formatReviewResponse(review),
      product: {
        id: review.product.id,
        name: review.product.name,
        imageUrl: review.product.images[0]?.imageUrl,
      },
    }));

    const response = new ApiResponseBuilder()
      .setMessage('User reviews retrieved successfully')
      .setData({
        reviews: formattedReviews,
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
    logger.error('Error getting reviews by user:', error);
    next(error);
  }
}

export const updateReview = async (
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

    const review = await prisma.review.findFirst({
      where: {
        id: id as string,
        userId,
      },
    });

    if (!review) {
      throw createError(404, 'Review not found or you do not have permission to update it');
    }

    const updatedReview = await prisma.review.update({
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

    const response = new ApiResponseBuilder()
      .setMessage('Review updated successfully')
      .setData(formatReviewResponse(updatedReview))
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error updating review:', error);
    next(error);
  }
}

export const deleteReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const review = await prisma.review.findFirst({
      where: {
        id: id as string,
        userId,
      },
    });

    if (!review) {
      throw createError(404, 'Review not found or you do not have permission to delete it');
    }

    await prisma.review.delete({
      where: { id: id as string },
    });

    const response = new ApiResponseBuilder()
      .setMessage('Review deleted successfully')
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error deleting review:', error);
    next(error);
  }
}

export const getProductRatingSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId: productId as string },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      const response = new ApiResponseBuilder()
        .setMessage('No reviews found for this product')
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
      .setMessage('Product rating summary retrieved successfully')
      .setData({
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution,
      })
      .build();

    res.json(response);
  } catch (error) {
    logger.error('Error getting product rating summary:', error);
    next(error);
  }
}
