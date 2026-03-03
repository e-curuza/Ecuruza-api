import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import createError from 'http-errors'
import { logger } from "../utils/logger.js";
import { ApiResponseBuilder } from "../utils/ApiResponse.js";
import type { AuthenticatedRequest } from "../middlewares/authenticate.js";
import type { CategoryResponse } from "../utils/type.js";

const generateSlug = (name: string) =>{
    return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'_')
    .replace(/(^-|-$)/g, '')
}
export const createCategory = async (
    req:AuthenticatedRequest,
    res:Response,
    next:NextFunction
):Promise<void> => {
    try {
        const {name} = req.body
        const existingCategory = await prisma.category.findFirst({where: {name}})
        if(existingCategory) throw createError(400, "Category already exists");

        const slug = generateSlug(name)

        const category = await prisma.category.create({
            data:{
                name,
                slug
            }
            
        })
        logger.info("category created ")
        const response = ApiResponseBuilder.created('category created ',{
            category
        })

        res.status(201).json(response)
    } catch (error) {
        next(error)
    }
}
export const getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const {page = 1, limit = 50, status } = req.query;
        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1 ) * limitNum

        const where: any = {};
        if(typeof status === "string" && status) where.status = status

        const [categories , total ] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc'}
            }),
            prisma.category.count({where})
        ])
        logger.info("Categories retrived successfully")
        const response = ApiResponseBuilder.paginated(
            'Categories retrived successfully',
            categories,
            {page:pageNum, limit:limitNum, totalItems:total}
        )

        res.status(200).json(response);
    } catch (error) {
        next(error)
    }
}

export const getCategoryById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        if (Array.isArray(id)) throw createError(400, 'Invalid category ID');

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw createError(404, 'Category not found');

        logger.info(`Category retrieved: ${category.id}`);
        const response = ApiResponseBuilder.success('Category retrieved successfully', category);
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const updateCategory = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (Array.isArray(id)) throw createError(400, 'Invalid category ID');

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw createError(404, 'Category not found');

        const updateData: any = {};
        if (name) {
            const existingCategory = await prisma.category.findFirst({ where: { name, id: { not: id } } });
            if (existingCategory) throw createError(400, 'Category name already exists');
            updateData.name = name;
            updateData.slug = generateSlug(name);
        }

        const updatedCategory = await prisma.category.update({ where: { id }, data: updateData });

        logger.info(`Category updated: ${updatedCategory.id}`);
        const response = ApiResponseBuilder.success('Category updated successfully', updatedCategory);
        res.json(response);
    } catch (error) {
        next(error);
    }
}

export const deleteCategory = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;

        if (Array.isArray(id)) throw createError(400, 'Invalid category ID');

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw createError(404, 'Category not found');

        // Check if category has products
        const productCount = await prisma.product.count({ where: { categoryId: id } });
        if (productCount > 0) throw createError(400, 'Cannot delete category with existing products');

        await prisma.category.delete({ where: { id } });

        logger.info(`Category deleted: ${id}`);
        const response = ApiResponseBuilder.success('Category deleted successfully');
        res.json(response);
    } catch (error) {
        next(error);
    }
}