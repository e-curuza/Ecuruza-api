import { Router } from "express";
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, getProductsByShop, createProductVariant, getProductVariants, updateProductVariant, deleteProductVariant, updateInventory, getInventoryByVariant } from "../controllers/product.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { uploadProductImages } from "../middlewares/multer.js";
import { createProductValidation, updateProductValidation, productIdValidation, shopIdValidation, getAllProductsValidation, getProductsByShopValidation, createProductVariantValidation, variantIdValidation, updateProductVariantValidation, updateInventoryValidation, validate } from "../middlewares/validations/product.validate.js";
const router = Router()

router
  .post('/', authenticate, uploadProductImages.array('images', 10), createProductValidation, validate, createProduct)
  .get('/all', getAllProductsValidation, validate, getAllProducts)
  .get('/:id', productIdValidation, validate, getProductById)
  .put('/:id', authenticate, uploadProductImages.array('images', 10), updateProductValidation, validate, updateProduct)
  .delete('/:id', authenticate, productIdValidation, validate, deleteProduct)
  .get('/shop/:shopId', shopIdValidation, getProductsByShopValidation, validate, getProductsByShop)

  .post('/:productId/variants', authenticate, createProductVariantValidation, validate, createProductVariant)
  .get('/:productId/variants', productIdValidation, validate, getProductVariants)
  .put('/variants/:variantId', authenticate, updateProductVariantValidation, validate, updateProductVariant)
  .delete('/variants/:variantId', authenticate, variantIdValidation, validate, deleteProductVariant)

  .put('/variants/:variantId/inventory', authenticate, updateInventoryValidation, validate, updateInventory)
  .get('/variants/:variantId/inventory', variantIdValidation, validate, getInventoryByVariant)



export default router;