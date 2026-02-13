/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Shop management for sellers
 */

/**
 * @swagger
 * /api/v1/shop:
 *   post:
 *     summary: Create a new shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Awesome Shop"
 *                 description: Shop name (2-100 characters)
 *               description:
 *                 type: string
 *                 example: "Best products in town"
 *                 description: Shop description (max 2000 characters)
 *               phone:
 *                 type: string
 *                 example: "+250789356233"
 *                 description: Business phone number
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "shop@example.com"
 *                 description: Business email
 *               address:
 *                 type: string
 *                 example: "Kigali, Rwanda"
 *                 description: Physical location (max 255 characters)
 *               returnPolicy:
 *                 type: string
 *                 example: "Returns accepted within 30 days"
 *                 description: Return policy text (max 2000 characters)
 *               shippingPolicy:
 *                 type: string
 *                 example: "Free shipping on orders over $50"
 *                 description: Shipping policy text (max 2000 characters)
 *               facebookUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://facebook.com/myshop"
 *                 description: Facebook page URL
 *               twitterUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://twitter.com/myshop"
 *                 description: Twitter profile URL
 *               instagramUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://instagram.com/myshop"
 *                 description: Instagram profile URL
 *               linkedinUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://linkedin.com/company/myshop"
 *                 description: LinkedIn profile URL
 *               youtubeUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://youtube.com/@myshop"
 *                 description: YouTube channel URL
 *               tiktokUrl:
 *                 type: string
 *                 format: url
 *                 example: "https://tiktok.com/@myshop"
 *                 description: TikTok profile URL
 *               logo:
 *                 type: file
 *                 format: binary
 *                 description: Shop logo image (JPEG, PNG, GIF, WebP, max 5MB)
 *               banner:
 *                 type: file
 *                 format: binary
 *                 description: Shop banner image (JPEG, PNG, GIF, WebP, max 5MB)
 *     responses:
 *       201:
 *         description: Shop created successfully
 *       400:
 *         description: Validation error or shop already exists
 *       403:
 *         description: Not a registered seller
 */

/**
 * @swagger
 * /api/v1/shop/{id}:
 *   put:
 *     summary: Update shop details
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Shop name (2-100 characters)
 *               description:
 *                 type: string
 *                 description: Shop description (max 2000 characters)
 *               phone:
 *                 type: string
 *                 description: Business phone number
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Business email
 *               address:
 *                 type: string
 *                 description: Physical location (max 255 characters)
 *               returnPolicy:
 *                 type: string
 *                 description: Return policy text (max 2000 characters)
 *               shippingPolicy:
 *                 type: string
 *                 description: Shipping policy text (max 2000 characters)
 *               facebookUrl:
 *                 type: string
 *                 format: url
 *                 description: Facebook page URL
 *               twitterUrl:
 *                 type: string
 *                 format: url
 *                 description: Twitter profile URL
 *               instagramUrl:
 *                 type: string
 *                 format: url
 *                 description: Instagram profile URL
 *               linkedinUrl:
 *                 type: string
 *                 format: url
 *                 description: LinkedIn profile URL
 *               youtubeUrl:
 *                 type: string
 *                 format: url
 *                 description: YouTube channel URL
 *               tiktokUrl:
 *                 type: string
 *                 format: url
 *                 description: TikTok profile URL
 *               logo:
 *                 type: file
 *                 format: binary
 *                 description: New shop logo image
 *               banner:
 *                 type: file
 *                 format: binary
 *                 description: New shop banner image
 *     responses:
 *       200:
 *         description: Shop updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized to update this shop
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop/my-shop:
 *   get:
 *     summary: Get current seller's shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shop retrieved successfully
 *       403:
 *         description: Not a registered seller
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop/all:
 *   get:
 *     summary: Get all active shops (public)
 *     tags: [Shops]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of shops retrieved successfully
 */

/**
 * @swagger
 * /api/v1/shop/slug/{slug}:
 *   get:
 *     summary: Get shop by slug (public)
 *     tags: [Shops]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop slug
 *     responses:
 *       200:
 *         description: Shop retrieved successfully
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop/{id}:
 *   get:
 *     summary: Get shop by ID (public)
 *     tags: [Shops]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop retrieved successfully
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop/{id}:
 *   delete:
 *     summary: Delete shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop deleted successfully
 *       403:
 *         description: Not authorized to delete this shop
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop/{id}/view:
 *   post:
 *     summary: Increment shop view count (public)
 *     tags: [Shops]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: View counted successfully
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop/{id}/reviews:
 *   post:
 *     summary: Add a review to a shop
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Great products and fast delivery!"
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Validation error or already reviewed
 *       404:
 *         description: Shop not found
 */

/**
 * @swagger
 * /api/v1/shop/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a shop (public)
 *     tags: [Shops]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: List of reviews retrieved successfully
 */

/**
 * @swagger
 * /api/v1/shop/{id}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a shop review
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Not authorized to delete this review
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/v1/shop/my-shop/stats:
 *   get:
 *     summary: Get shop statistics (views, ratings, reviews count)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shop statistics retrieved successfully
 *       403:
 *         description: Not a registered seller
 *       404:
 *         description: Shop not found
 */
