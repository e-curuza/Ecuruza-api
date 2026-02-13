import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';
import { ApiResponseBuilder } from '../utils/ApiResponse.js';
import type { AuthenticatedRequest } from '../middlewares/authenticate.js';

const prisma = new PrismaClient();

export async function becomeSeller(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { businessName, businessType, businessAddress } = req.body;

    const existingSeller = await prisma.seller.findUnique({ where: { userId } });
    if (existingSeller) throw createError(400, 'You are already a seller');

    const seller = await prisma.seller.create({
      data: { userId, businessName, businessType, businessAddress, verificationStatus: 'PENDING', commissionRate: 0.1 },
    });

    await prisma.user.update({ where: { id: userId }, data: { role: 'SELLER' } });

    logger.info(`User applied to become seller: ${userId}`);
    const response = ApiResponseBuilder.created('Seller application submitted successfully', { id: seller.id, businessName: seller.businessName, businessType: seller.businessType, verificationStatus: seller.verificationStatus, commissionRate: seller.commissionRate });
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function getMySellerProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    const seller = await prisma.seller.findUnique({
      where: { userId },
      include: {
        shops: { select: { id: true, name: true, slug: true, logoUrl: true, status: true, rating: true, _count: { select: { products: true } } } },
        subscriptions: { where: { status: 'ACTIVE' }, select: { id: true, plan: true, duration: true, status: true, createdAt: true } },
        _count: { select: { ads: true, shops: true } },
      },
    });

    if (!seller) throw createError(404, 'Seller profile not found');

    const response = ApiResponseBuilder.success('Seller profile retrieved', seller);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function submitSellerApplication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { businessName, businessType, taxId, country, city, businessAddress, description, phone, email, website } = req.body;
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
        description,
        phone: phone || existingUser.phone,
        email: email || existingUser.email,
        website,
        idCardUrl,
        businessCertUrl,
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

export async function getMySellerApplication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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

export async function getAllSellerApplications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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

export async function getSellerApplicationById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (Array.isArray(id)) throw createError(400, 'Invalid application ID');

    const application = await prisma.sellerApplication.findUnique({
      where: { id },
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

export async function reviewSellerApplication(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const adminId = userPayload.userId;
    const { id } = req.params;
    const { status, adminMessage } = req.body;

    if (Array.isArray(id)) throw createError(400, 'Invalid application ID');

    const application = await prisma.sellerApplication.findUnique({ where: { id } });
    if (!application) throw createError(404, 'Application not found');
    if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
      throw createError(400, 'Application has already been reviewed');
    }

    const updatedApplication = await prisma.sellerApplication.update({
      where: { id },
      data: {
        status,
        adminMessage,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    if (status === 'APPROVED') {
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

export async function getBusinessInfo(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;

    const seller = await prisma.seller.findUnique({
      where: { userId },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        businessAddress: true,
        verificationStatus: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!seller) throw createError(404, 'Seller profile not found');

    const response = ApiResponseBuilder.success('Business info retrieved', seller);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateBusinessInfo(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload.userId;
    const { businessName, businessType, businessRegistrationNumber, country, city, fullBusinessAddress } = req.body;
    const file = req.file as Express.Multer.File | undefined;

    const seller = await prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw createError(404, 'Seller profile not found');

    const updateData: any = {
      businessName,
      businessType,
    };

    if (fullBusinessAddress) {
      updateData.businessAddress = fullBusinessAddress;
    }

    if (file?.path) {
      updateData.idCardUrl = file.path;
    }

    const updatedSeller = await prisma.seller.update({
      where: { userId },
      data: updateData,
    });

    logger.info(`Business info updated for seller: ${userId}`);
    const response = ApiResponseBuilder.success('Business info updated successfully', {
      id: updatedSeller.id,
      businessName: updatedSeller.businessName,
      businessType: updatedSeller.businessType,
      businessAddress: updatedSeller.businessAddress,
      verificationStatus: updatedSeller.verificationStatus,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
}
