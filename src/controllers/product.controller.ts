import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import createError from 'http-errors'
import { logger } from "../utils/logger.js";
import { ApiResponseBuilder } from "../utils/ApiResponse.js";
import type { AuthenticatedRequest } from "../middlewares/authenticate.js";
import { r2Service } from "../services/r2.service.js";
import { r2Config } from "../config/r2.config.js";
import type { ProductStatus, ProductVisibility, ProductFilters, CreateProductRequest, UpdateProductRequest } from "../utils/type.js";
import { Prisma } from "@prisma/client";


export const createProduct = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.userId;

        const { shopId, categoryId, name, description, basePrice } = req.body as CreateProductRequest;

        const seller = await prisma.seller.findUnique({ where: { userId } });
        if (!seller) throw createError(403, "You must be registered as seller to create product")

        const shop = await prisma.shop.findUnique({where:{id:shopId as string}  });
        if(!shop) throw createError(404, "shop not found check if the shop exist");

        const category = await prisma.category.findUnique({where:{id:categoryId as string}});
        if(!category) throw createError(404, "category not found check if the category exist");

          const product = await prisma.product.create({
            data:{
                shopId: shop.id,
                categoryId: category.id,
                name,
                description,
                basePrice,
                discount:0,
                status: "DRAFT",
                visibility: "PUBLIC",
            }
          })

          // Handle image uploads
          const files = req.files as Express.Multer.File[];
          let productImages: any[] = [];
          if (files && files.length > 0) {
            const imageUploads = files.map(async (file, index) => {
              const category = 'products';
              const folder = r2Config.bucketName + '/' + category;

              const result = await r2Service.uploadFile(file.buffer, {
                folder,
                filename: file.originalname,
                contentType: file.mimetype,
              });

              return {
                productId: product.id,
                imageUrl: result.url,
                isPrimary: index === 0, // First image is primary
              };
            });

            const imageData = await Promise.all(imageUploads);

            await prisma.productImage.createMany({
              data: imageData,
            });

            // Fetch the created images with ids
            productImages = await prisma.productImage.findMany({
              where: { productId: product.id },
              select: { id: true, productId: true, imageUrl: true, isPrimary: true }
            });
          }

          logger.info(`Product created: ${product.name} of ${shop.name} and by ${seller.userId}`)
          const response = ApiResponseBuilder.created('Product created successful',{
            product: {
              ...product,
              images: productImages
            }
          })

          res.status(201).json(response)
    } catch (error) {
        next(error)
    }
}

export const getAllProducts = async (
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
): Promise<void> => {
    try {
        const {page = 1, limit = 50, status } =req.query;
        
        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1 ) * limitNum;

        const where: Prisma.ProductWhereInput = {};
        if (typeof status === 'string' && status) where.status = status as ProductStatus;

        const [producs, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limitNum,
                orderBy : {createdAt: 'desc'},
                include:{
                    shop: {select: {id:true, name:true, logoUrl:true, phone: true, email:true, address:true, sellerId:true}},
                    category:{select:{id:true, name:true, slug:true}},
                    images: {select: {id: true, imageUrl: true, isPrimary: true}},
                    variants: {
                        include: {
                            inventory: true
                        }
                    },
                    inventory: true
                }
            }),
            prisma.product.count({ where })
        ])
        logger.info("Product retrieved successfully");

        const response = ApiResponseBuilder.paginated(
            'Product retrieved successfully',
            producs,
            {page: pageNum, limit: limitNum, totalItems: total}
        )

        res.status(200).json(response)
    } catch (error) {
        next(error)
    }
}

export const getProductById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        if (Array.isArray(id)) throw createError(400, 'Invalid product ID');

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                shop: { select: { id: true, name: true, logoUrl: true, phone: true, email: true, address: true, sellerId: true } },
                category: { select: { id: true, name: true, slug: true } },
                images: { select: { id: true, imageUrl: true, isPrimary: true } },
                variants: {
                    include: {
                        inventory: true
                    }
                },
                inventory: true
            }
        });

        if (!product) throw createError(404, 'Product not found');

        logger.info(`Product retrieved: ${product.id}`);
        const response = ApiResponseBuilder.success('Product retrieved successfully', product);
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const updateProduct = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.userId;
        const { id } = req.params;
        const { name, description, basePrice, discount, status, visibility, categoryId } = req.body;
        const files = req.files as Express.Multer.File[];

        if (Array.isArray(id)) throw createError(400, 'Invalid product ID');

        const seller = await prisma.seller.findUnique({ where: { userId } });
        if (!seller) throw createError(403, 'You must be a registered seller to update product');

        const product = await prisma.product.findUnique({ 
            where: { id },
            include: { shop: { select: { sellerId: true } } }
        });
        if (!product) throw createError(404, 'Product not found');
        if (product.shop.sellerId !== seller.id) throw createError(403, 'You can only update your own products');

        const updateData: Prisma.ProductUpdateInput = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (basePrice) updateData.basePrice = basePrice;
        if (discount !== undefined) updateData.discount = discount;
        if (status) updateData.status = status as ProductStatus;
        if (visibility) updateData.visibility = visibility as ProductVisibility;
        if (categoryId) {
            const category = await prisma.category.findUnique({ where: { id: categoryId } });
            if (!category) throw createError(404, 'Category not found');
            updateData.category = { connect: { id: category.id } };
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                shop: { select: { id: true, name: true, logoUrl: true } },
                category: { select: { id: true, name: true, slug: true } },
                images: { select: { id: true, imageUrl: true, isPrimary: true } }
            }
        });

        // Handle new image uploads
        if (files && files.length > 0) {
            const imageUploads = files.map(async (file, index) => {
                const category = 'products';
                const folder = r2Config.bucketName + '/' + category;

                const result = await r2Service.uploadFile(file.buffer, {
                    folder,
                    filename: file.originalname,
                    contentType: file.mimetype,
                });

                return {
                    productId: updatedProduct.id,
                    imageUrl: result.url,
                    isPrimary: index === 0 && updatedProduct.images.length === 0, // First new image is primary if no existing images
                };
            });

            const imageData = await Promise.all(imageUploads);
            await prisma.productImage.createMany({ data: imageData });
        }

        // Fetch updated images
        const productImages = await prisma.productImage.findMany({
            where: { productId: updatedProduct.id },
            select: { id: true, productId: true, imageUrl: true, isPrimary: true }
        });

        logger.info(`Product updated: ${updatedProduct.id}`);
        const response = ApiResponseBuilder.success('Product updated successfully', {
            product: {
                ...updatedProduct,
                images: productImages
            }
        });
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const deleteProduct = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.userId;
        const { id } = req.params;

        if (Array.isArray(id)) throw createError(400, 'Invalid product ID');

        const seller = await prisma.seller.findUnique({ where: { userId } });
        if (!seller) throw createError(403, 'You must be a registered seller to delete product');

        const product = await prisma.product.findUnique({ 
            where: { id },
            include: { shop: { select: { sellerId: true } } }
        });
        if (!product) throw createError(404, 'Product not found');
        if (product.shop.sellerId !== seller.id) throw createError(403, 'You can only delete your own products');

        // Delete associated images from R2
        const images = await prisma.productImage.findMany({ where: { productId: id } });
        for (const image of images) {
            await r2Service.deleteFile(image.imageUrl);
        }

        await prisma.productImage.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } });

        logger.info(`Product deleted: ${id}`);
        const response = ApiResponseBuilder.success('Product deleted successfully');
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const getProductsByShop = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { shopId } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        if (Array.isArray(shopId)) throw createError(400, 'Invalid shop ID');

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * limitNum;

        const where: Prisma.ProductWhereInput = { shopId };
        if (typeof status === 'string' && status) where.status = status as ProductStatus;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    images: { select: { id: true, imageUrl: true, isPrimary: true } },
                    variants: {
                        include: {
                            inventory: true
                        }
                    },
                    inventory: true
                }
            }),
            prisma.product.count({ where })
        ]);

        logger.info(`Products retrieved for shop: ${shopId}`);
        const response = ApiResponseBuilder.paginated(
            'Products retrieved successfully',
            products,
            { page: pageNum, limit: limitNum, totalItems: total }
        );
        res.json(response);
    } catch (error) {
        next(error);
    }
}

// ProductVariant operations
export const createProductVariant = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.userId;
        const { productId } = req.params;
        const { sku, price, stock, attributes, quantity, lowStockAlert } = req.body;

        if (Array.isArray(productId)) throw createError(400, 'Invalid product ID');

        const seller = await prisma.seller.findUnique({ where: { userId } });
        if (!seller) throw createError(403, 'You must be a registered seller to create product variant');

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { shop: { select: { sellerId: true } } }
        });
        if (!product) throw createError(404, 'Product not found');
        if (product.shop.sellerId !== seller.id) throw createError(403, 'You can only create variants for your own products');

        // Check if SKU already exists
        const existingVariant = await prisma.productVariant.findUnique({ where: { sku } });
        if (existingVariant) throw createError(400, 'SKU already exists');

        const variant = await prisma.productVariant.create({
            data: {
                productId,
                sku,
                price,
                stock,
                attributes
            }
        });

        // Create inventory record
        const inventory = await prisma.inventory.create({
            data: {
                productVariantId: variant.id,
                productId,
                quantity: quantity || stock,
                lowStockAlert
            }
        });

        logger.info(`Product variant created: ${variant.id} for product: ${productId}`);
        const response = ApiResponseBuilder.created('Product variant created successfully', {
            variant: {
                ...variant,
                inventory
            }
        });
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
}

export const getProductVariants = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { productId } = req.params;

        if (Array.isArray(productId)) throw createError(400, 'Invalid product ID');

        const variants = await prisma.productVariant.findMany({
            where: { productId },
            include: {
                inventory: true
            }
        });

        logger.info(`Product variants retrieved for product: ${productId}`);
        const response = ApiResponseBuilder.success('Product variants retrieved successfully', variants);
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const updateProductVariant = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.userId;
        const { variantId } = req.params;
        const { sku, price, stock, attributes, quantity, lowStockAlert } = req.body;

        if (Array.isArray(variantId)) throw createError(400, 'Invalid variant ID');

        const seller = await prisma.seller.findUnique({ where: { userId } });
        if (!seller) throw createError(403, 'You must be a registered seller to update product variant');

        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                product: {
                    include: { shop: { select: { sellerId: true } } }
                }
            }
        });
        if (!variant) throw createError(404, 'Product variant not found');
        if (variant.product.shop.sellerId !== seller.id) throw createError(403, 'You can only update variants for your own products');

        // Check SKU uniqueness if updating SKU
        if (sku && sku !== variant.sku) {
            const existingVariant = await prisma.productVariant.findUnique({ where: { sku } });
            if (existingVariant) throw createError(400, 'SKU already exists');
        }

        const updateData: Prisma.ProductVariantUpdateInput = {};
        if (sku) updateData.sku = sku;
        if (price !== undefined) updateData.price = price;
        if (stock !== undefined) updateData.stock = stock;
        if (attributes !== undefined) updateData.attributes = attributes as any;

        const updatedVariant = await prisma.productVariant.update({
            where: { id: variantId },
            data: updateData,
            include: {
                inventory: true
            }
        });

        // Update inventory if provided
        if (quantity !== undefined || lowStockAlert !== undefined) {
            const inventoryUpdate: Prisma.InventoryUpdateInput = {};
            if (quantity !== undefined) inventoryUpdate.quantity = quantity;
            if (lowStockAlert !== undefined) inventoryUpdate.lowStockAlert = lowStockAlert;

            await prisma.inventory.updateMany({
                where: { productVariantId: variantId },
                data: inventoryUpdate
            });

            // Refresh inventory data
            const updatedInventory = await prisma.inventory.findFirst({
                where: { productVariantId: variantId }
            });
            updatedVariant.inventory = [updatedInventory!];
        }

        logger.info(`Product variant updated: ${variantId}`);
        const response = ApiResponseBuilder.success('Product variant updated successfully', updatedVariant);
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const deleteProductVariant = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.userId;
        const { variantId } = req.params;

        if (Array.isArray(variantId)) throw createError(400, 'Invalid variant ID');

        const seller = await prisma.seller.findUnique({ where: { userId } });
        if (!seller) throw createError(403, 'You must be a registered seller to delete product variant');

        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                product: {
                    include: { shop: { select: { sellerId: true } } }
                }
            }
        });
        if (!variant) throw createError(404, 'Product variant not found');
        if (variant.product.shop.sellerId !== seller.id) throw createError(403, 'You can only delete variants for your own products');

        // Delete inventory first
        await prisma.inventory.deleteMany({ where: { productVariantId: variantId } });

        // Delete variant
        await prisma.productVariant.delete({ where: { id: variantId } });

        logger.info(`Product variant deleted: ${variantId}`);
        const response = ApiResponseBuilder.success('Product variant deleted successfully');
        res.json(response);
    } catch (error) {
        next(error);
    }
}

// Inventory operations
export const updateInventory = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userPayload = (req as any).user;
        const userId = userPayload.userId;
        const { variantId } = req.params;
        const { quantity, lowStockAlert } = req.body;

        if (Array.isArray(variantId)) throw createError(400, 'Invalid variant ID');

        const seller = await prisma.seller.findUnique({ where: { userId } });
        if (!seller) throw createError(403, 'You must be a registered seller to update inventory');

        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                product: {
                    include: { shop: { select: { sellerId: true } } }
                }
            }
        });
        if (!variant) throw createError(404, 'Product variant not found');
        if (variant.product.shop.sellerId !== seller.id) throw createError(403, 'You can only update inventory for your own products');

        const updateData: any = {};
        if (quantity !== undefined) updateData.quantity = quantity;
        if (lowStockAlert !== undefined) updateData.lowStockAlert = lowStockAlert;

        const updatedInventory = await prisma.inventory.updateMany({
            where: { productVariantId: variantId },
            data: updateData
        });

        // Get updated inventory
        const inventory = await prisma.inventory.findFirst({
            where: { productVariantId: variantId }
        });

        logger.info(`Inventory updated for variant: ${variantId}`);
        const response = ApiResponseBuilder.success('Inventory updated successfully', inventory);
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const getInventoryByVariant = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { variantId } = req.params;

        if (Array.isArray(variantId)) throw createError(400, 'Invalid variant ID');

        const inventory = await prisma.inventory.findFirst({
            where: { productVariantId: variantId }
        });

        if (!inventory) throw createError(404, 'Inventory not found for this variant');

        logger.info(`Inventory retrieved for variant: ${variantId}`);
        const response = ApiResponseBuilder.success('Inventory retrieved successfully', inventory);
        res.json(response);
    } catch (error) {
        next(error);
    }
}
