/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product review management APIs
 */

// ============================================
// PUBLIC APIS
// ============================================

/**
 * @swagger
 * /api/v1/reviews/product/{productId}:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, rating]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
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
 *                   example: "Reviews retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ReviewResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid product ID
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/reviews/product/{productId}/summary:
 *   get:
 *     summary: Get rating summary for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Rating summary retrieved successfully
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
 *                   example: "Product rating summary retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                       example: 4.2
 *                     totalReviews:
 *                       type: integer
 *                       example: 25
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         1:
 *                           type: integer
 *                           example: 2
 *                         2:
 *                           type: integer
 *                           example: 1
 *                         3:
 *                           type: integer
 *                           example: 3
 *                         4:
 *                           type: integer
 *                           example: 8
 *                         5:
 *                           type: integer
 *                           example: 11
 *       400:
 *         description: Invalid product ID
 *       500:
 *         description: Internal server error
 */

// ============================================
// AUTHENTICATED APIS
// ============================================

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product being reviewed
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional review comment
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *                   example: "Review created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Invalid input data or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/reviews/user:
 *   get:
 *     summary: Get current user's reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, rating]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
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
 *                   example: "User reviews retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           productId:
 *                             type: string
 *                             format: uuid
 *                           rating:
 *                             type: integer
 *                           comment:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               avatarUrl:
 *                                 type: string
 *                           product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               imageUrl:
 *                                 type: string
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Review comment
 *     responses:
 *       200:
 *         description: Review updated successfully
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
 *                   example: "Review updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                   example: "Review deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 */