/**
 * @swagger
 * components:
 *   schemas:
 *     ShopReview:
 *       type: object
 *       properties:
 *           userId:
 *           type: string
 *           format: uuid
 *           description: The ID of the user who wrote the review
 *         shopId:
 *           type: string
 *           format: uuid
 *           description: The ID of the shop being reviewed
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: The rating given to the shop (1-5)
 *         comment:
 *           type: string
 *           maxLength: 1000
 *           description: Optional comment about the shop
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the review was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the review was last updated
 *         user:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             avatarUrl:
 *               type: string
 *               nullable: true
 *       required:
 *         - id
 *         - userId
 *         - shopId
 *         - rating
 *         - createdAt
 *         - updatedAt
 * 
 *     CreateShopReviewRequest:
 *       type: object
 *       properties:
 *         shopId:
 *           type: string
 *           format: uuid
 *           description: The ID of the shop to review
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: The rating given to the shop (1-5)
 *         comment:
 *           type: string
 *           maxLength: 1000
 *           description: Optional comment about the shop
 *       required:
 *         - shopId
 *         - rating
 * 
 *     UpdateShopReviewRequest:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: The updated rating (1-5)
 *         comment:
 *           type: string
 *           maxLength: 1000
 *           description: Updated comment about the shop
 * 
 *     ShopRatingSummary:
 *       type: object
 *       properties:
 *         averageRating:
 *           type: number
 *           description: Average rating of the shop
 *         totalReviews:
 *           type: integer
 *           description: Total number of reviews
 *         ratingDistribution:
 *           type: object
 *           properties:
 *             1:
 *               type: integer
 *             2:
 *               type: integer
 *             3:
 *               type: integer
 *             4:
 *               type: integer
 *             5:
 *               type: integer
 * 
 *     ShopReviewsResponse:
 *       type: object
 *       properties:
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ShopReview'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 * 
 *   responses:
 *     ShopReviewCreated:
 *       description: Shop review created successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: success
 *               message:
 *                 type: string
 *                 example: Shop review created successfully
 *               data:
 *                 $ref: '#/components/schemas/ShopReview'
 * 
 *     ShopReviewsList:
 *       description: List of shop reviews retrieved successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: success
 *               message:
 *                 type: string
 *                 example: Shop reviews retrieved successfully
 *               data:
 *                 $ref: '#/components/schemas/ShopReviewsResponse'
 * 
 *     ShopReviewUpdated:
 *       description: Shop review updated successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: success
 *               message:
 *                 type: string
 *                 example: Shop review updated successfully
 *               data:
 *                 $ref: '#/components/schemas/ShopReview'
 * 
 *     ShopReviewDeleted:
 *       description: Shop review deleted successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: success
 *               message:
 *                 type: string
 *                 example: Shop review deleted successfully
 * 
 *     ShopRatingSummaryRetrieved:
 *       description: Shop rating summary retrieved successfully
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: success
 *               message:
 *                 type: string
 *                 example: Shop rating summary retrieved successfully
 *               data:
 *                 $ref: '#/components/schemas/ShopRatingSummary'
 */

/**
 * @swagger
 * /api/v1/shop-reviews:
 *   post:
 *     summary: Create a new shop review
 *     tags:
 *       - Shop Reviews
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShopReviewRequest'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/ShopReviewCreated'
 *       400:
 *         description: Bad request - validation error or review already exists
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Shop not found
 * 
 *   get:
 *     summary: Get current user's shop reviews
 *     tags:
 *       - Shop Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, rating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ShopReviewsList'
 *       401:
 *         description: Unauthorized - authentication required
 */

/**
 * @swagger
 * /api/v1/shop-reviews/{id}:
 *   put:
 *     summary: Update a shop review
 *     tags:
 *       - Shop Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateShopReviewRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ShopReviewUpdated'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Review not found or not authorized
 * 
 *   delete:
 *     summary: Delete a shop review
 *     tags:
 *       - Shop Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ShopReviewDeleted'
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Review not found or not authorized
 */

/**
 * @swagger
 * /api/v1/shop-reviews/shop/{shopId}:
 *   get:
 *     summary: Get all reviews for a shop
 *     tags:
 *       - Shop Reviews
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, rating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ShopReviewsList'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop-reviews/shop/{shopId}/rating-summary:
 *   get:
 *     summary: Get rating summary for a shop
 *     tags:
 *       - Shop Reviews
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ShopRatingSummaryRetrieved'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Shop not found
 */

export {};
