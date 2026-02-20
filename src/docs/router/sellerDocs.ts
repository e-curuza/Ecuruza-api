/**
 * @swagger
 * tags:
 *   name: Sellers
 *   description: Seller management and onboarding APIs
 */

// ============================================
// SELLER ONBOARDING & BUSINESS VERIFICATION
// ============================================

/**
 * @swagger
 * /api/v1/sellers/onboarding:
 *   post:
 *     summary: Submit business verification for seller onboarding
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - businessType
 *               - country
 *               - city
 *               - businessAddress
 *             properties:
 *               businessName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Business legal name
 *               businessType:
 *                 type: string
 *                 enum: [INDIVIDUAL, COMPANY]
 *                 description: Type of business entity
 *               taxId:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 20
 *                 description: Business registration number (optional)
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Country of business operation
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: City of business operation
 *               businessAddress:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *                 description: Full business address
 *               idCard:
 *                 type: string
 *                 format: binary
 *                 description: Identity document upload (optional)
 *     responses:
 *       201:
 *         description: Business verification submitted successfully
 *       400:
 *         description: Invalid input or already a seller
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/sellers/applications/me:
 *   get:
 *     summary: Get current seller business verification status
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business verification retrieved successfully
 *       404:
 *         description: No business verification found
 */

/**
 * @swagger
 * /api/v1/sellers/me:
 *   get:
 *     summary: Get comprehensive seller profile with user info, business details, and statistics
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile retrieved successfully
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
 *                   example: "Seller profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+1234567890"
 *                         avatarUrl:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                         bio:
 *                           type: string
 *                           example: "Experienced seller with 5+ years in e-commerce"
 *                         role:
 *                           type: string
 *                           example: "SELLER"
 *                         status:
 *                           type: string
 *                           example: "ACTIVE"
 *                         emailVerified:
 *                           type: boolean
 *                           example: true
 *                         phoneVerified:
 *                           type: boolean
 *                           example: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-15T10:30:00.000Z"
 *                         lastLoginAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-20T08:15:00.000Z"
 *                     seller:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174001"
 *                         businessName:
 *                           type: string
 *                           example: "Tech Solutions Inc"
 *                         businessType:
 *                           type: string
 *                           enum: [INDIVIDUAL, COMPANY]
 *                           example: "COMPANY"
 *                         businessAddress:
 *                           type: string
 *                           example: "123 Business St, City, Country"
 *                         verificationStatus:
 *                           type: string
 *                           enum: [PENDING, VERIFIED, REJECTED]
 *                           example: "VERIFIED"
 *                         commissionRate:
 *                           type: number
 *                           format: float
 *                           example: 0.1
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-20T14:20:00.000Z"
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalShops:
 *                           type: integer
 *                           example: 2
 *                         totalProducts:
 *                           type: integer
 *                           example: 25
 *                         totalOrders:
 *                           type: integer
 *                           example: 150
 *                         activeAds:
 *                           type: integer
 *                           example: 3
 *                         activeSubscriptions:
 *                           type: integer
 *                           example: 1
 *                     shops:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174002"
 *                           name:
 *                             type: string
 *                             example: "Tech Store"
 *                           slug:
 *                             type: string
 *                             example: "tech-store"
 *                           logoUrl:
 *                             type: string
 *                             example: "https://example.com/logo.png"
 *                           status:
 *                             type: string
 *                             enum: [PENDING, ACTIVE, SUSPENDED]
 *                             example: "ACTIVE"
 *                           rating:
 *                             type: number
 *                             format: float
 *                             example: 4.5
 *                           description:
 *                             type: string
 *                             example: "Premium tech products store"
 *                           _count:
 *                             type: object
 *                             properties:
 *                               products:
 *                                 type: integer
 *                                 example: 15
 *                               orders:
 *                                 type: integer
 *                                 example: 89
 *                     subscriptions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174003"
 *                           plan:
 *                             type: string
 *                             example: "PREMIUM"
 *                           duration:
 *                             type: integer
 *                             example: 30
 *                           status:
 *                             type: string
 *                             example: "ACTIVE"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-19T12:00:00.000Z"
 *       404:
 *         description: Seller profile not found
 */
/**
 * @swagger
 * /api/v1/sellers/dashboard:
 *   get:
 *     summary: Get seller dashboard with key metrics, recent activity, and analytics
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller dashboard retrieved successfully
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
 *                   example: "Seller dashboard retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalShops:
 *                           type: integer
 *                           example: 2
 *                         totalProducts:
 *                           type: integer
 *                           example: 25
 *                         totalOrders:
 *                           type: integer
 *                           example: 150
 *                         totalRevenue:
 *                           type: number
 *                           format: float
 *                           example: 15750.00
 *                         activeAds:
 *                           type: integer
 *                           example: 3
 *                         averageRating:
 *                           type: number
 *                           format: float
 *                           example: 4.5
 *                     monthlyStats:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: integer
 *                           example: 45
 *                         revenue:
 *                           type: number
 *                           format: float
 *                           example: 5250.00
 *                     recentOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                             example: "123e4567-e89b-12d3-a456-426614174003"
 *                           customerName:
 *                             type: string
 *                             example: "Jane Smith"
 *                           productName:
 *                             type: string
 *                             example: "Wireless Headphones"
 *                           shopName:
 *                             type: string
 *                             example: "Tech Store"
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           price:
 *                             type: number
 *                             format: float
 *                             example: 99.99
 *                           total:
 *                             type: number
 *                             format: float
 *                             example: 199.98
 *                           status:
 *                             type: string
 *                             enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 *                             example: "DELIVERED"
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-18T14:30:00.000Z"
 *                     lowStockAlerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productName:
 *                             type: string
 *                             example: "Bluetooth Speaker"
 *                           shopName:
 *                             type: string
 *                             example: "Audio Store"
 *                           stock:
 *                             type: integer
 *                             example: 3
 *                           sku:
 *                             type: string
 *                             example: "SPK-BT-001"
 *                     recentReviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           customerName:
 *                             type: string
 *                             example: "Mike Johnson"
 *                           productName:
 *                             type: string
 *                             example: "Gaming Mouse"
 *                           shopName:
 *                             type: string
 *                             example: "Gaming Store"
 *                           rating:
 *                             type: integer
 *                             minimum: 1
 *                             maximum: 5
 *                             example: 5
 *                           comment:
 *                             type: string
 *                             example: "Excellent product, fast shipping!"
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-02-19T10:15:00.000Z"
 *       404:
 *         description: Seller not found
 */

/**
 * @swagger
 * /api/v1/sellers/profile:
 *   put:
 *     summary: Update seller profile information
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Seller's first name
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Seller's last name
 *               phone:
 *                 type: string
 *                 description: Seller's phone number
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: Seller's bio
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile avatar image
 *     responses:
 *       200:
 *         description: Seller profile updated successfully
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
 *                   example: "Seller profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         phone:
 *                           type: string
 *                           example: "+1234567890"
 *                         avatarUrl:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                         bio:
 *                           type: string
 *                           example: "Experienced seller with 5+ years in e-commerce"
 *                         role:
 *                           type: string
 *                           example: "SELLER"
 *                         status:
 *                           type: string
 *                           example: "ACTIVE"
 *                         emailVerified:
 *                           type: boolean
 *                           example: true
 *                         phoneVerified:
 *                           type: boolean
 *                           example: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-15T10:30:00.000Z"
 *                     seller:
 *                       type: object
 *                       description: Seller business information
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Seller not found
 */

/**
 * @swagger
 * /api/v1/sellers/business:
 *   put:
 *     summary: Update seller business information
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Business legal name
 *               businessType:
 *                 type: string
 *                 enum: [INDIVIDUAL, COMPANY]
 *                 description: Type of business entity
 *               businessAddress:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *                 description: Full business address
 *     responses:
 *       200:
 *         description: Seller business updated successfully
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
 *                   example: "Seller business updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     businessName:
 *                       type: string
 *                       example: "Updated Business Name"
 *                     businessType:
 *                       type: string
 *                       enum: [INDIVIDUAL, COMPANY]
 *                       example: "COMPANY"
 *                     businessAddress:
 *                       type: string
 *                       example: "Updated Business Address"
 *                     verificationStatus:
 *                       type: string
 *                       enum: [PENDING, VERIFIED, REJECTED]
 *                       example: "VERIFIED"
 *       404:
 *         description: Seller not found
 *       400:
 *         description: Invalid input data
 */

/**
 * @swagger
 * /api/v1/sellers/applications:
 *   get:
 *     summary: Get all seller business verifications (admin)
 *     tags: [Sellers, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Business verifications retrieved successfully
 */

/**
 * @swagger
 * /api/v1/sellers/applications/{id}:
 *   get:
 *     summary: Get seller business verification by ID (admin)
 *     tags: [Sellers, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business verification ID
 *     responses:
 *       200:
 *         description: Business verification retrieved successfully
 *       404:
 *         description: Business verification not found
 */

/**
 * @swagger
 * /api/v1/sellers/applications/{id}/review:
 *   post:
 *     summary: Approve or reject seller business verification (admin)
 *     tags: [Sellers, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Business verification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               adminMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Business verification approved/rejected successfully
 *       400:
 *         description: Business verification already reviewed
 *       404:
 *         description: Business verification not found
 */
