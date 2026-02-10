import { logger, LogLevel } from "./logger";

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

export interface AppErrorOptions {
  code?: ErrorCode;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  logLevel?: LogLevel;
  action?: string;
  userId?: string | number;
  meta?: Record<string, any>;
  isOperational?: boolean;
  stack?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, any> | undefined;
  public readonly isOperational: boolean;
  public readonly action: string | undefined;
  public readonly userId: string | number | undefined;
  public readonly meta: Record<string, any> | undefined;
  public readonly timestamp: string;

  constructor(options: AppErrorOptions) {
    super(options.message);
    
    this.name = "AppError";
    this.code = options.code || ErrorCode.INTERNAL_ERROR;
    this.statusCode = options.statusCode || 500;
    this.details = options.details;
    this.isOperational = options.isOperational !== false;
    this.action = options.action;
    this.userId = options.userId;
    this.meta = options.meta;
    this.timestamp = new Date().toISOString();

    if (options.stack) {
      this.stack = options.stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    const logLevel = options.logLevel || (this.isOperational ? LogLevel.WARN : LogLevel.ERROR);
    logger.log(logLevel, this.message, {
      code: this.code,
      statusCode: this.statusCode,
      action: this.action,
      userId: this.userId,
      meta: this.meta,
      isOperational: this.isOperational,
    });
  }

  toJSON(): Record<string, any> {
    const json: Record<string, any> = {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
    };
    if (this.details !== undefined) {
      json.details = this.details;
    }
    if (this.action !== undefined) {
      json.action = this.action;
    }
    if (this.userId !== undefined) {
      json.userId = this.userId;
    }
    if (this.meta !== undefined) {
      json.meta = this.meta;
    }
    if (this.isOperational && this.stack) {
      json.stack = this.stack;
    }
    return json;
  }

  static badRequest(message: string, details?: Record<string, any>): AppError {
    const opts: AppErrorOptions = {
      code: ErrorCode.BAD_REQUEST,
      message,
      statusCode: 400,
      logLevel: LogLevel.INFO,
      isOperational: true,
    };
    if (details !== undefined) {
      opts.details = details;
    }
    return new AppError(opts);
  }

  static unauthorized(message: string = "Unauthorized"): AppError {
    return new AppError({
      code: ErrorCode.UNAUTHORIZED,
      message,
      statusCode: 401,
      logLevel: LogLevel.INFO,
      isOperational: true,
    });
  }

  static forbidden(message: string = "Forbidden"): AppError {
    return new AppError({
      code: ErrorCode.FORBIDDEN,
      message,
      statusCode: 403,
      logLevel: LogLevel.INFO,
      isOperational: true,
    });
  }

  static notFound(message: string = "Resource not found"): AppError {
    return new AppError({
      code: ErrorCode.NOT_FOUND,
      message,
      statusCode: 404,
      logLevel: LogLevel.INFO,
      isOperational: true,
    });
  }

  static conflict(message: string, details?: Record<string, any>): AppError {
    const opts: AppErrorOptions = {
      code: ErrorCode.CONFLICT,
      message,
      statusCode: 409,
      logLevel: LogLevel.INFO,
      isOperational: true,
    };
    if (details !== undefined) {
      opts.details = details;
    }
    return new AppError(opts);
  }

  static validationError(message: string, details?: Record<string, any>): AppError {
    const opts: AppErrorOptions = {
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 422,
      logLevel: LogLevel.INFO,
      isOperational: true,
    };
    if (details !== undefined) {
      opts.details = details;
    }
    return new AppError(opts);
  }

  static internal(message: string = "Internal server error", meta?: Record<string, any>): AppError {
    const opts: AppErrorOptions = {
      code: ErrorCode.INTERNAL_ERROR,
      message,
      statusCode: 500,
      isOperational: false,
    };
    if (meta !== undefined) {
      opts.meta = meta;
    }
    return new AppError(opts);
  }

  static databaseError(message: string, meta?: Record<string, any>): AppError {
    const opts: AppErrorOptions = {
      code: ErrorCode.DATABASE_ERROR,
      message,
      statusCode: 500,
      isOperational: false,
    };
    if (meta !== undefined) {
      opts.meta = meta;
    }
    return new AppError(opts);
  }

  static externalServiceError(service: string, message: string, meta?: Record<string, any>): AppError {
    const opts: AppErrorOptions = {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: `External service error (${service}): ${message}`,
      statusCode: 502,
      action: `external_service_${service}`,
      meta: { service },
      isOperational: true,
    };
    if (meta !== undefined) {
      opts.meta = { ...opts.meta, ...meta };
    }
    return new AppError(opts);
  }

  static rateLimitExceeded(retryAfter?: number): AppError {
    const opts: AppErrorOptions = {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Too many requests. Please try again later.",
      statusCode: 429,
      logLevel: LogLevel.WARN,
      isOperational: true,
    };
    if (retryAfter !== undefined) {
      opts.details = { retryAfter };
    }
    return new AppError(opts);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

interface ExtractErrorResult {
  message: string;
  code: string;
  statusCode: number;
  stack?: string;
}

export function extractErrorInfo(error: unknown): ExtractErrorResult {
  if (isAppError(error)) {
    const result: ExtractErrorResult = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
    if (error.stack) {
      result.stack = error.stack;
    }
    return result;
  }

  if (error instanceof Error) {
    const result: ExtractErrorResult = {
      message: error.message,
      code: ErrorCode.INTERNAL_ERROR,
      statusCode: 500,
    };
    if (error.stack) {
      result.stack = error.stack;
    }
    return result;
  }

  return {
    message: String(error),
    code: ErrorCode.INTERNAL_ERROR,
    statusCode: 500,
  };
}
