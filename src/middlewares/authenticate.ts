import { type Request, type Response, type NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, extractTokenFromHeader } from '../utils/auth.utils';
import type { TokenPayload } from '../utils/type';
import createError from 'http-errors';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
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

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
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

export function authorize(...allowedRoles: string[]) {
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

export function authenticateRefreshToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
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

export function authenticateWithFallback(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
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

export function adminWithRefresh(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('ADMIN')(req, res, next);
  });
}

export function sellerWithRefresh(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('SELLER')(req, res, next);
  });
}

export function customerWithRefresh(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('CUSTOMER')(req, res, next);
  });
}

export function adminOrSellerWithRefresh(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateRefreshToken(req, res, (err) => {
    if (err) return next(err);
    authorize('ADMIN', 'SELLER')(req, res, next);
  });
}

export function adminWithFallback(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  authenticateWithFallback(req, res, (err) => {
    if (err) return next(err);
    authorize('ADMIN')(req, res, next);
  });
}
