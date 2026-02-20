import { type Request, type Response, type NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, extractTokenFromHeader } from '../utils/auth.utils.js';
import type { TokenPayload } from '../utils/type.js';
import createError from 'http-errors';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw createError(401, 'Access token is required');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
    next();
  } catch (error) {
    next();
  }
}

export const authorize = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Unauthorized access attempt by user ${req.user.userId} with role ${req.user.role}`);
        throw createError(403, 'You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const adminOnly = authorize('ADMIN');
export const sellerOnly = authorize('SELLER');
export const customerOnly = authorize('CUSTOMER');
export const adminOrSeller = authorize('ADMIN', 'SELLER');

export const authenticateRefreshToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['x-refresh-token'] as string | undefined;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw createError(401, 'Refresh token is required');
    }

    const decoded = verifyRefreshToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

export const authenticateWithFallback = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
      return;
    }

    const refreshToken = req.headers['x-refresh-token'] as string | undefined || 
                         req.cookies?.refreshToken;
    
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

export const adminWithRefresh = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('ADMIN')(req, res, next);
  });
}

export const sellerWithRefresh = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('SELLER')(req, res, next);
  });
}

export const customerWithRefresh = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('CUSTOMER')(req, res, next);
  });
}

export const adminOrSellerWithRefresh = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('ADMIN', 'SELLER')(req, res, next);
  });
}

export const adminWithFallback = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  authenticateWithFallback(req, res, (err) => {
    if (err) return next(err);
    authorize('ADMIN')(req, res, next);
  });
}
