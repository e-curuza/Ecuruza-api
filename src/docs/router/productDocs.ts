/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - shopId
 *               - categoryId
 *               - name
 *               - basePrice
 *             properties:
 *               shopId:
 *                 type: string
 *                 description: The ID of the shop
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               categoryId:
 *                 type: string
 *                 description: The ID of the category
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               name:
 *                 type: string
 *                 description: The name of the product
 *                 example: "Wireless Headphones"
 *               description:
 *                 type: string
 *                 description: The description of the product
 *                 example: "High-quality wireless headphones with noise cancellation"
 *               basePrice:
 *                 type: number
 *                 format: float
 *                 description: The base price of the product
 *                 example: 99.99
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (up to 10 images, first image will be marked as primary). ProductId will be automatically assigned to link images to the created product.
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product created successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174002"
 *                         shopId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         categoryId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174001"
 *                         name:
 *                           type: string
 *                           example: "Wireless Headphones"
 *                         description:
 *                           type: string
 *                           example: "High-quality wireless headphones with noise cancellation"
 *                         basePrice:
 *                           type: number
 *                           format: float
 *                           example: 99.99
 *                         discount:
 *                           type: number
 *                           format: float
 *                           example: 0
 *                         status:
 *                           type: string
 *                           enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *                           example: "DRAFT"
 *                         visibility:
 *                           type: string
 *                           enum: [PUBLIC, HIDDEN]
 *                           example: "PUBLIC"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-19T12:00:00.000Z"
 *                         images:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "123e4567-e89b-12d3-a456-426614174004"
 *                               productId:
 *                                 type: string
 *                                 example: "123e4567-e89b-12d3-a456-426614174002"
 *                               imageUrl:
 *                                 type: string
 *                                 example: "https://example.com/products/image1.jpg"
 *                               isPrimary:
 *                                 type: boolean
 *                                 example: true
 *       400:
 *         description: Bad request - Invalid input or product already exists
 *       403:
 *         description: Forbidden - User is not registered as a seller
 *       404:
 *         description: Not found - Shop or category not found
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 */

/**
 * @swagger
 * /api/v1/products/all:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of products per page
 *         example: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *         description: Filter products by status
 *         example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174002"
 *                       shopId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       categoryId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174001"
 *                       name:
 *                         type: string
 *                         example: "Wireless Headphones"
 *                       description:
 *                         type: string
 *                         example: "High-quality wireless headphones with noise cancellation"
 *                       basePrice:
 *                         type: number
 *                         format: float
 *                         example: 99.99
 *                       discount:
 *                         type: number
 *                         format: float
 *                         example: 0
 *                       status:
 *                         type: string
 *                         enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *                         example: "ACTIVE"
 *                       visibility:
 *                         type: string
 *                         enum: [PUBLIC, HIDDEN]
 *                         example: "PUBLIC"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-19T12:00:00.000Z"
 *                       shop:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           name:
 *                             type: string
 *                             example: "Tech Store"
 *                           logoUrl:
 *                             type: string
 *                             example: "https://example.com/logo.png"
 *                           phone:
 *                             type: string
 *                             example: "+1234567890"
 *                           email:
 *                             type: string
 *                             example: "store@example.com"
 *                           address:
 *                             type: string
 *                             example: "123 Main St, City, State"
 *                           sellerId:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174003"
 *                       category:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174001"
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           slug:
 *                             type: string
 *                             example: "electronics"
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174004"
 *                             imageUrl:
 *                               type: string
 *                               example: "https://example.com/products/image1.jpg"
 *                             isPrimary:
 *                               type: boolean
 *                               example: true
 *                       variants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174005"
 *                             productId:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174002"
 *                             sku:
 *                               type: string
 *                               example: "WH-BLK-L"
 *                             price:
 *                               type: number
 *                               format: float
 *                               example: 89.99
 *                             stock:
 *                               type: integer
 *                               example: 50
 *                             attributes:
 *                               type: object
 *                               example: {"Size": "Large", "Color": "Black"}
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2026-02-20T12:00:00.000Z"
 *                             inventory:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                     example: "123e4567-e89b-12d3-a456-426614174006"
 *                                   productVariantId:
 *                                     type: string
 *                                     example: "123e4567-e89b-12d3-a456-426614174005"
 *                                   quantity:
 *                                     type: integer
 *                                     example: 50
 *                                   lowStockAlert:
 *                                     type: integer
 *                                     example: 10
 *                       inventory:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174007"
 *                             productId:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174002"
 *                             quantity:
 *                               type: integer
 *                               example: 100
 *                             lowStockAlert:
 *                               type: integer
 *                               example: 20
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     totalItems:
 *                       type: integer
 *                       example: 150
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174002"
 *                     shopId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     categoryId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174001"
 *                     name:
 *                       type: string
 *                       example: "Wireless Headphones"
 *                     description:
 *                       type: string
 *                       example: "High-quality wireless headphones with noise cancellation"
 *                     basePrice:
 *                       type: number
 *                       format: float
 *                       example: 99.99
 *                     discount:
 *                       type: number
 *                       format: float
 *                       example: 0
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *                       example: "ACTIVE"
 *                     visibility:
 *                       type: string
 *                       enum: [PUBLIC, HIDDEN]
 *                       example: "PUBLIC"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-19T12:00:00.000Z"
 *                     shop:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         name:
 *                           type: string
 *                           example: "Tech Store"
 *                         logoUrl:
 *                           type: string
 *                           example: "https://example.com/logo.png"
 *                         phone:
 *                           type: string
 *                           example: "+1234567890"
 *                         email:
 *                           type: string
 *                           example: "store@example.com"
 *                         address:
 *                           type: string
 *                           example: "123 Main St, City, State"
 *                         sellerId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174003"
 *                     category:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174001"
 *                         name:
 *                           type: string
 *                           example: "Electronics"
 *                         slug:
 *                           type: string
 *                           example: "electronics"
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174004"
 *                           imageUrl:
 *                             type: string
 *                             example: "https://example.com/products/image1.jpg"
 *                           isPrimary:
 *                             type: boolean
 *                             example: true
 *                     variants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174005"
 *                           productId:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174002"
 *                           sku:
 *                             type: string
 *                             example: "WH-BLK-L"
 *                           price:
 *                             type: number
 *                             format: float
 *                             example: 89.99
 *                           stock:
 *                             type: integer
 *                             example: 50
 *                           attributes:
 *                             type: object
 *                             example: {"Size": "Large", "Color": "Black"}
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-20T12:00:00.000Z"
 *                           inventory:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   example: "123e4567-e89b-12d3-a456-426614174006"
 *                                 productVariantId:
 *                                   type: string
 *                                   example: "123e4567-e89b-12d3-a456-426614174005"
 *                                 quantity:
 *                                   type: integer
 *                                   example: 50
 *                                 lowStockAlert:
 *                                   type: integer
 *                                   example: 10
 *                     inventory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174007"
 *                           productId:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174002"
 *                           quantity:
 *                             type: integer
 *                             example: 100
 *                           lowStockAlert:
 *                             type: integer
 *                             example: 20
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name of the product
 *                 example: "Updated Wireless Headphones"
 *               description:
 *                 type: string
 *                 description: The new description of the product
 *                 example: "Updated high-quality wireless headphones with noise cancellation"
 *               basePrice:
 *                 type: number
 *                 format: float
 *                 description: The new base price of the product
 *                 example: 109.99
 *               discount:
 *                 type: number
 *                 format: float
 *                 description: The discount percentage
 *                 example: 10
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *                 description: The status of the product
 *                 example: "ACTIVE"
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, HIDDEN]
 *                 description: The visibility of the product
 *                 example: "PUBLIC"
 *               categoryId:
 *                 type: string
 *                 description: The ID of the new category
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New product images (up to 10 images, first image will be marked as primary if no existing images)
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174002"
 *                         shopId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         categoryId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174001"
 *                         name:
 *                           type: string
 *                           example: "Updated Wireless Headphones"
 *                         description:
 *                           type: string
 *                           example: "Updated high-quality wireless headphones with noise cancellation"
 *                         basePrice:
 *                           type: number
 *                           format: float
 *                           example: 109.99
 *                         discount:
 *                           type: number
 *                           format: float
 *                           example: 10
 *                         status:
 *                           type: string
 *                           enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *                           example: "ACTIVE"
 *                         visibility:
 *                           type: string
 *                           enum: [PUBLIC, HIDDEN]
 *                           example: "PUBLIC"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-19T12:00:00.000Z"
 *                         shop:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174000"
 *                             name:
 *                               type: string
 *                               example: "Tech Store"
 *                             logoUrl:
 *                               type: string
 *                               example: "https://example.com/logo.png"
 *                         category:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174001"
 *                             name:
 *                               type: string
 *                               example: "Electronics"
 *                             slug:
 *                               type: string
 *                               example: "electronics"
 *                         images:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "123e4567-e89b-12d3-a456-426614174004"
 *                               productId:
 *                                 type: string
 *                                 example: "123e4567-e89b-12d3-a456-426614174002"
 *                               imageUrl:
 *                                 type: string
 *                                 example: "https://example.com/products/image1.jpg"
 *                               isPrimary:
 *                                 type: boolean
 *                                 example: true
 *       400:
 *         description: Invalid product ID or input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner of the product
 *       404:
 *         description: Product or category not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product deleted successfully"
 *       400:
 *         description: Invalid product ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner of the product
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/products/shop/{shopId}:
 *   get:
 *     summary: Get products by shop
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of products per page
 *         example: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *         description: Filter products by status
 *         example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Products retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174002"
 *                       shopId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       categoryId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174001"
 *                       name:
 *                         type: string
 *                         example: "Wireless Headphones"
 *                       description:
 *                         type: string
 *                         example: "High-quality wireless headphones with noise cancellation"
 *                       basePrice:
 *                         type: number
 *                         format: float
 *                         example: 99.99
 *                       discount:
 *                         type: number
 *                         format: float
 *                         example: 0
 *                       status:
 *                         type: string
 *                         enum: [DRAFT, ACTIVE, OUT_OF_STOCK]
 *                         example: "ACTIVE"
 *                       visibility:
 *                         type: string
 *                         enum: [PUBLIC, HIDDEN]
 *                         example: "PUBLIC"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-19T12:00:00.000Z"
 *                       category:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174001"
 *                           name:
 *                             type: string
 *                             example: "Electronics"
 *                           slug:
 *                             type: string
 *                             example: "electronics"
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174004"
 *                             imageUrl:
 *                               type: string
 *                               example: "https://example.com/products/image1.jpg"
 *                             isPrimary:
 *                               type: boolean
 *                               example: true
 *                       variants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174005"
 *                             productId:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174002"
 *                             sku:
 *                               type: string
 *                               example: "WH-BLK-L"
 *                             price:
 *                               type: number
 *                               format: float
 *                               example: 89.99
 *                             stock:
 *                               type: integer
 *                               example: 50
 *                             attributes:
 *                               type: object
 *                               example: {"Size": "Large", "Color": "Black"}
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2026-02-20T12:00:00.000Z"
 *                             inventory:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                     example: "123e4567-e89b-12d3-a456-426614174006"
 *                                   productVariantId:
 *                                     type: string
 *                                     example: "123e4567-e89b-12d3-a456-426614174005"
 *                                   quantity:
 *                                     type: integer
 *                                     example: 50
 *                                   lowStockAlert:
 *                                     type: integer
 *                                     example: 10
 *                       inventory:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174007"
 *                             productId:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174002"
 *                             quantity:
 *                               type: integer
 *                               example: 100
 *                             lowStockAlert:
 *                               type: integer
 *                               example: 20
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: Invalid shop ID
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/products/{productId}/variants:
 *   post:
 *     summary: Create a product variant
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the product
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sku
 *               - price
 *               - stock
 *             properties:
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit - unique identifier for the variant
 *                 example: "WH-BLK-L"
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Price of the variant
 *                 example: 89.99
 *               stock:
 *                 type: integer
 *                 description: Stock quantity for the variant
 *                 example: 50
 *               attributes:
 *                 type: object
 *                 description: Variant attributes (e.g., size, color)
 *                 example: {"Size": "Large", "Color": "Black"}
 *               quantity:
 *                 type: integer
 *                 description: Initial inventory quantity (defaults to stock value)
 *                 example: 50
 *               lowStockAlert:
 *                 type: integer
 *                 description: Low stock alert threshold
 *                 example: 10
 *     responses:
 *       201:
 *         description: Product variant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product variant created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     variant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174005"
 *                         productId:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174002"
 *                         sku:
 *                           type: string
 *                           example: "WH-BLK-L"
 *                         price:
 *                           type: number
 *                           format: float
 *                           example: 89.99
 *                         stock:
 *                           type: integer
 *                           example: 50
 *                         attributes:
 *                           type: object
 *                           example: {"Size": "Large", "Color": "Black"}
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-20T12:00:00.000Z"
 *                         inventory:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174006"
 *                             productVariantId:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174005"
 *                             quantity:
 *                               type: integer
 *                               example: 50
 *                             lowStockAlert:
 *                               type: integer
 *                               example: 10
 *       400:
 *         description: Bad request - Invalid input or SKU already exists
 *       403:
 *         description: Forbidden - User is not the seller of this product
 *       404:
 *         description: Not found - Product not found
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 */

/**
 * @swagger
 * /api/v1/products/{productId}/variants:
 *   get:
 *     summary: Get all variants for a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the product
 *         example: "123e4567-e89b-12d3-a456-426614174002"
 *     responses:
 *       200:
 *         description: Product variants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product variants retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174005"
 *                       productId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174002"
 *                       sku:
 *                         type: string
 *                         example: "WH-BLK-L"
 *                       price:
 *                         type: number
 *                         format: float
 *                         example: 89.99
 *                       stock:
 *                         type: integer
 *                         example: 50
 *                       attributes:
 *                         type: object
 *                         example: {"Size": "Large", "Color": "Black"}
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-02-20T12:00:00.000Z"
 *                       inventory:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174006"
 *                             productVariantId:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174005"
 *                             quantity:
 *                               type: integer
 *                               example: 50
 *                             lowStockAlert:
 *                               type: integer
 *                               example: 10
 *       400:
 *         description: Invalid product ID
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/products/variants/{variantId}:
 *   put:
 *     summary: Update a product variant
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the product variant
 *         example: "123e4567-e89b-12d3-a456-426614174005"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *                 description: Stock Keeping Unit - unique identifier for the variant
 *                 example: "WH-BLK-XL"
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Price of the variant
 *                 example: 95.99
 *               stock:
 *                 type: integer
 *                 description: Stock quantity for the variant
 *                 example: 75
 *               attributes:
 *                 type: object
 *                 description: Variant attributes (e.g., size, color)
 *                 example: {"Size": "Extra Large", "Color": "Black"}
 *               quantity:
 *                 type: integer
 *                 description: Inventory quantity
 *                 example: 75
 *               lowStockAlert:
 *                 type: integer
 *                 description: Low stock alert threshold
 *                 example: 15
 *     responses:
 *       200:
 *         description: Product variant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product variant updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174005"
 *                     productId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174002"
 *                     sku:
 *                       type: string
 *                       example: "WH-BLK-XL"
 *                     price:
 *                       type: number
 *                       format: float
 *                       example: 95.99
 *                     stock:
 *                       type: integer
 *                       example: 75
 *                     attributes:
 *                       type: object
 *                       example: {"Size": "Extra Large", "Color": "Black"}
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-02-20T12:00:00.000Z"
 *                     inventory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174006"
 *                           productVariantId:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174005"
 *                           quantity:
 *                             type: integer
 *                             example: 75
 *                           lowStockAlert:
 *                             type: integer
 *                             example: 15
 *       400:
 *         description: Bad request - Invalid input or SKU already exists
 *       403:
 *         description: Forbidden - User is not the seller of this product
 *       404:
 *         description: Not found - Product variant not found
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 */

/**
 * @swagger
 * /api/v1/products/variants/{variantId}:
 *   delete:
 *     summary: Delete a product variant
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the product variant
 *         example: "123e4567-e89b-12d3-a456-426614174005"
 *     responses:
 *       200:
 *         description: Product variant deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product variant deleted successfully"
 *       400:
 *         description: Invalid variant ID
 *       403:
 *         description: Forbidden - User is not the seller of this product
 *       404:
 *         description: Not found - Product variant not found
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 */

/**
 * @swagger
 * /api/v1/products/variants/{variantId}/inventory:
 *   put:
 *     summary: Update inventory for a product variant
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the product variant
 *         example: "123e4567-e89b-12d3-a456-426614174005"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Current inventory quantity
 *                 example: 100
 *               lowStockAlert:
 *                 type: integer
 *                 description: Low stock alert threshold
 *                 example: 20
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Inventory updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174006"
 *                     productVariantId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174005"
 *                     quantity:
 *                       type: integer
 *                       example: 100
 *                     lowStockAlert:
 *                       type: integer
 *                       example: 20
 *       400:
 *         description: Bad request - Invalid input
 *       403:
 *         description: Forbidden - User is not the seller of this product
 *       404:
 *         description: Not found - Product variant not found
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 */

/**
 * @swagger
 * /api/v1/products/variants/{variantId}/inventory:
 *   get:
 *     summary: Get inventory for a product variant
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the product variant
 *         example: "123e4567-e89b-12d3-a456-426614174005"
 *     responses:
 *       200:
 *         description: Inventory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Inventory retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174006"
 *                     productVariantId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174005"
 *                     quantity:
 *                       type: integer
 *                       example: 100
 *                     lowStockAlert:
 *                       type: integer
 *                       example: 20
 *       400:
 *         description: Invalid variant ID
 *       404:
 *         description: Not found - Inventory not found for this variant
 *       500:
 *         description: Internal server error
 */