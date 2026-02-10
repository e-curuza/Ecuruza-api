import { $Enums } from '@prisma/client';
export type UserRole = $Enums.UserRole;
export type UserStatus = $Enums.UserStatus;
export type SellerBusinessType = $Enums.SellerBusinessType;
export type VerificationStatus = $Enums.VerificationStatus;
export type ShopStatus = $Enums.ShopStatus;
export type ProductStatus = $Enums.ProductStatus;
export type ProductVisibility = $Enums.ProductVisibility;
export type OrderStatus = $Enums.OrderStatus;
export type PaymentStatus = $Enums.PaymentStatus;
export type SubscriptionStatus = $Enums.SubscriptionStatus;
export type AdStatus = $Enums.AdStatus;
export declare const UserRole: {
    ADMIN: "ADMIN";
    SELLER: "SELLER";
    CUSTOMER: "CUSTOMER";
};
export declare const UserStatus: {
    ACTIVE: "ACTIVE";
    SUSPENDED: "SUSPENDED";
    DELETED: "DELETED";
};
export declare const SellerBusinessType: {
    INDIVIDUAL: "INDIVIDUAL";
    COMPANY: "COMPANY";
};
export declare const VerificationStatus: {
    PENDING: "PENDING";
    VERIFIED: "VERIFIED";
    REJECTED: "REJECTED";
};
export declare const ShopStatus: {
    PENDING: "PENDING";
    ACTIVE: "ACTIVE";
    SUSPENDED: "SUSPENDED";
};
export declare const ProductStatus: {
    DRAFT: "DRAFT";
    ACTIVE: "ACTIVE";
    OUT_OF_STOCK: "OUT_OF_STOCK";
};
export declare const ProductVisibility: {
    PUBLIC: "PUBLIC";
    HIDDEN: "HIDDEN";
};
export declare const OrderStatus: {
    PENDING: "PENDING";
    CONFIRMED: "CONFIRMED";
    SHIPPED: "SHIPPED";
    DELIVERED: "DELIVERED";
    CANCELLED: "CANCELLED";
};
export declare const PaymentStatus: {
    PENDING: "PENDING";
    COMPLETED: "COMPLETED";
    FAILED: "FAILED";
    REFUNDED: "REFUNDED";
};
export declare const SubscriptionStatus: {
    ACTIVE: "ACTIVE";
    INACTIVE: "INACTIVE";
    EXPIRED: "EXPIRED";
};
export declare const AdStatus: {
    ACTIVE: "ACTIVE";
    INACTIVE: "INACTIVE";
    EXPIRED: "EXPIRED";
};
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface AuthPayload {
    userId: string;
    email: string;
    role: UserRole;
}
export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
}
export interface AuthResponse {
    user: UserResponse;
    accessToken: string;
    refreshToken: string;
}
export interface UserResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: Date;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface SearchParams extends PaginationParams {
    search?: string;
}
export interface ProductFilters {
    categoryId?: string;
    shopId?: string;
    status?: ProductStatus;
    visibility?: ProductVisibility;
    minPrice?: number;
    maxPrice?: number;
}
export interface CreateProductRequest {
    shopId: string;
    categoryId: string;
    name: string;
    description?: string;
    basePrice: number;
    discount?: number;
    status: ProductStatus;
    visibility: ProductVisibility;
}
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
}
export interface CreateProductVariantRequest {
    productId: string;
    sku: string;
    price: number;
    stock: number;
    attributes?: Record<string, string>;
}
export interface ProductVariantResponse {
    id: string;
    productId: string;
    sku: string;
    price: number;
    stock: number;
    attributes?: Record<string, string>;
}
export interface CreateProductImageRequest {
    productId: string;
    imageUrl: string;
    isPrimary?: boolean;
}
export interface ShopFilters {
    status?: ShopStatus;
    sellerId?: string;
}
export interface CreateShopRequest {
    sellerId: string;
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
    bannerUrl?: string;
}
export interface UpdateShopRequest extends Partial<Omit<CreateShopRequest, 'sellerId'>> {
}
export interface OrderFilters {
    userId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
}
export interface CreateOrderRequest {
    userId: string;
    items: CreateOrderItemRequest[];
    shippingAddress: AddressRequest;
}
export interface CreateOrderItemRequest {
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
}
export interface AddressRequest {
    address: string;
    city: string;
    street: string;
    isDefault?: boolean;
}
export interface OrderItemResponse {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
    product?: ProductBasicResponse;
}
export interface OrderResponse {
    id: string;
    userId: string;
    status: OrderStatus;
    total: number;
    paymentStatus: PaymentStatus;
    createdAt: Date;
    items?: OrderItemResponse[];
}
export interface ProductImageResponse {
    id: string;
    productId: string;
    imageUrl: string;
    isPrimary: boolean;
}
export interface ProductBasicResponse {
    id: string;
    name: string;
    basePrice: number;
    images?: ProductImageResponse[];
}
export interface PaymentRequest {
    orderId: string;
    method: string;
    provider: string;
    amount: number;
}
export interface PaymentResponse {
    id: string;
    orderId: string;
    method: string;
    provider: string;
    amount: number;
    status: PaymentStatus;
    createdAt: Date;
}
export interface CreateReviewRequest {
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
}
export interface ReviewResponse {
    id: string;
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}
export interface NotificationResponse {
    id: string;
    userId: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}
export interface MessageResponse {
    id: string;
    userId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
}
export interface SellerFilters {
    verificationStatus?: VerificationStatus;
    businessType?: SellerBusinessType;
}
export interface CreateSellerRequest {
    userId: string;
    businessName: string;
    businessType: SellerBusinessType;
    businessAddress?: string;
}
export interface SellerResponse {
    id: string;
    userId: string;
    businessName: string;
    businessType: SellerBusinessType;
    businessAddress?: string;
    verificationStatus: VerificationStatus;
    commissionRate: number;
    createdAt: Date;
}
export interface CategoryResponse {
    id: string;
    name: string;
    slug: string;
    status: boolean;
    createdAt: Date;
}
export interface CreateAdRequest {
    shopId: string;
    productId?: string;
    placement: string;
    startDate: Date;
    endDate: Date;
    sellerSubscriptionId?: string;
}
export interface AdResponse {
    id: string;
    shopId: string;
    productId?: string;
    placement: string;
    startDate: Date;
    endDate: Date;
    status: AdStatus;
}
export interface CreateSubscriptionRequest {
    sellerId: string;
    plan: string;
    price: number;
    duration: number;
}
export interface SubscriptionResponse {
    id: string;
    sellerId: string;
    plan: string;
    price: number;
    duration: number;
    status: SubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface AppError {
    statusCode: number;
    message: string;
    details?: ValidationError[];
}
//# sourceMappingURL=type.d.ts.map