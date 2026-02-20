import { Router } from "express";
import { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } from "../controllers/category.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { createCategoryValidation, updateCategoryValidation, categoryIdValidation, validate } from "../middlewares/validations/category.validate.js";
const router = Router()


router
    .post('/create', authenticate, createCategoryValidation, validate, createCategory)
    .get('/all', getAllCategories)
    .get('/:id', categoryIdValidation, validate, getCategoryById)
    .put('/:id', authenticate, updateCategoryValidation, validate, updateCategory)
    .delete('/:id', authenticate, categoryIdValidation, validate, deleteCategory)


export default router