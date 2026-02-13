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
 * /api/v1/seller/apply:
 *   post:
 *     summary: Submit seller application with business information
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
 *               - fullBusinessAddress
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Business legal name
 *               businessType:
 *                 type: string
 *                 enum: [INDIVIDUAL, COMPANY]
 *                 description: Type of business entity
 *               businessRegistrationNumber:
 *                 type: string
 *                 description: Business registration number (optional)
 *               country:
 *                 type: string
 *                 description: Country of business operation
 *               city:
 *                 type: string
 *                 description: City of business operation
 *               fullBusinessAddress:
 *                 type: string
 *                 description: Complete business address
 *               description:
 *                 type: string
 *                 description: Business description (optional)
 *               phone:
 *                 type: string
 *                 description: Business phone (optional)
 *               email:
 *                 type: string
 *                 description: Business email (optional)
 *               website:
 *                 type: string
 *                 description: Business website (optional)
 *               idCard:
 *                 type: string
 *                 format: binary
 *                 description: Identity document upload (optional)
 *     responses:
 *       201:
 *         description: Seller application submitted successfully
 *       400:
 *         description: Invalid input or already a seller
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/seller/application:
 *   get:
 *     summary: Get current seller application status
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *       404:
 *         description: No application found
 */

/**
 * @swagger
 * /api/v1/seller/business-info:
 *   get:
 *     summary: Get current business information
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business info retrieved successfully
 *       404:
 *         description: Seller profile not found
 *   put:
 *     summary: Update business information
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
 *               - fullBusinessAddress
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Business legal name
 *               businessType:
 *                 type: string
 *                 enum: [INDIVIDUAL, COMPANY]
 *                 description: Type of business entity
 *               businessRegistrationNumber:
 *                 type: string
 *                 description: Business registration number (optional)
 *               country:
 *                 type: string
 *                 description: Country of business operation
 *               city:
 *                 type: string
 *                 description: City of business operation
 *               fullBusinessAddress:
 *                 type: string
 *                 description: Complete business address
 *               idCard:
 *                 type: string
 *                 format: binary
 *                 description: Identity document upload (optional)
 *     responses:
 *       200:
 *         description: Business info updated successfully
 *       404:
 *         description: Seller profile not found
 */

/**
 * @swagger
 * /api/v1/seller/profile:
 *   get:
 *     summary: Get seller profile
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile retrieved
 *       404:
 *         description: Seller profile not found
 */

/**
 * @swagger
 * /api/v1/seller/become-seller:
 *   post:
 *     summary: Apply to become a seller (simplified)
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - businessType
 *             properties:
 *               businessName:
 *                 type: string
 *               businessType:
 *                 type: string
 *                 enum: [INDIVIDUAL, COMPANY]
 *               businessAddress:
 *                 type: string
 *     responses:
 *       201:
 *         description: Seller application submitted
 *       400:
 *         description: Already a seller
 */

/**
 * @swagger
 * /api/v1/seller/applications:
 *   get:
 *     summary: Get all seller applications (admin)
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
 *         description: Applications retrieved successfully
 */

/**
 * @swagger
 * /api/v1/seller/applications/{id}:
 *   get:
 *     summary: Get seller application by ID (admin)
 *     tags: [Sellers, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application retrieved successfully
 *       404:
 *         description: Application not found
 */

/**
 * @swagger
 * /api/v1/seller/applications/{id}/review:
 *   post:
 *     summary: Review seller application (admin)
 *     tags: [Sellers, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
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
 *         description: Application reviewed successfully
 *       400:
 *         description: Application already reviewed
 *       404:
 *         description: Application not found
 */
