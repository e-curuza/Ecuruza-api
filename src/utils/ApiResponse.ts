import { logger } from "./logger";

export enum ResponseStatus {
  SUCCESS = "success",
  ERROR = "error",
  FAIL = "fail",
}

export interface ApiResponseMeta {
  timestamp: string;
  path?: string;
  version?: string;
}

export interface ApiResponse<T = any> {
  status: ResponseStatus;
  message: string;
  data?: T;
  meta?: ApiResponseMeta;
  error?: {
    code: string;
    details: Record<string, any> | undefined;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class ApiResponseBuilder {
  private response: ApiResponse;

  constructor() {
    this.response = {
      status: ResponseStatus.SUCCESS,
      message: "",
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  setStatus(status: ResponseStatus): ApiResponseBuilder {
    this.response.status = status;
    return this;
  }

  setMessage(message: string): ApiResponseBuilder {
    this.response.message = message;
    return this;
  }

  setData<T>(data: T): ApiResponseBuilder {
    this.response.data = data;
    return this;
  }

  setError(code: string, details?: Record<string, any>): ApiResponseBuilder {
    this.response.status = ResponseStatus.ERROR;
    this.response.error = { code, details: details || undefined };
    logger.error(this.response.message, { code, ...(details || {}) });
    return this;
  }

  setPath(path: string): ApiResponseBuilder {
    this.response.meta = { ...this.response.meta!, path };
    return this;
  }

  setVersion(version: string): ApiResponseBuilder {
    this.response.meta = { ...this.response.meta!, version };
    return this;
  }

  build(): ApiResponse {
    return this.response;
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    const response = new ApiResponseBuilder();
    response.setStatus(ResponseStatus.SUCCESS);
    response.setMessage(message);
    if (data !== undefined) {
      response.setData(data);
    }
    logger.info(message, { status: ResponseStatus.SUCCESS, hasData: !!data });
    return response.build();
  }

  static created<T>(message: string, data: T): ApiResponse<T> {
    const response = new ApiResponseBuilder();
    response.setStatus(ResponseStatus.SUCCESS);
    response.setMessage(message);
    response.setData(data);
    logger.info(message, { status: ResponseStatus.SUCCESS, action: "created" });
    return response.build();
  }

  static error(code: string, message: string, details?: Record<string, any>): ApiResponse {
    const response = new ApiResponseBuilder();
    response.setStatus(ResponseStatus.ERROR);
    response.setMessage(message);
    response.setError(code, details);
    return response.build();
  }

  static badRequest(message: string, details?: Record<string, any>): ApiResponse {
    return ApiResponseBuilder.error("BAD_REQUEST", message, details);
  }

  static unauthorized(message: string = "Unauthorized"): ApiResponse {
    return ApiResponseBuilder.error("UNAUTHORIZED", message);
  }

  static forbidden(message: string = "Forbidden"): ApiResponse {
    return ApiResponseBuilder.error("FORBIDDEN", message);
  }

  static notFound(message: string = "Resource not found"): ApiResponse {
    return ApiResponseBuilder.error("NOT_FOUND", message);
  }

  static conflict(message: string, details?: Record<string, any>): ApiResponse {
    return ApiResponseBuilder.error("CONFLICT", message, details);
  }

  static internal(message: string = "Internal server error"): ApiResponse {
    return ApiResponseBuilder.error("INTERNAL_ERROR", message);
  }

  static paginated<T>(
    message: string,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
    }
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(pagination.totalItems / pagination.limit);
    const response = new ApiResponseBuilder();
    response.setStatus(ResponseStatus.SUCCESS);
    response.setMessage(message);
    response.setData(data);
    
    const baseResponse = response.build() as PaginatedResponse<T>;
    baseResponse.pagination = {
      currentPage: pagination.page,
      itemsPerPage: pagination.limit,
      totalItems: pagination.totalItems,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    };

    logger.info(message, { 
      status: ResponseStatus.SUCCESS, 
      action: "paginated",
      pagination: baseResponse.pagination 
    });

    return baseResponse;
  }
}
