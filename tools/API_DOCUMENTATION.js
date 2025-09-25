/**
 * BharatChain API Documentation
 * Government Digital Identity Platform - Complete API Reference
 * 
 * This comprehensive API documentation covers all endpoints in the BharatChain system,
 * including authentication, citizen services, document management, grievances, 
 * payments, blockchain integration, and AI services.
 * 
 * Base URL: http://localhost:5000/api
 * API Version: 1.0.0
 * Authentication: Bearer JWT Token
 * 
 * @swagger
 * securityDefinitions:
 *   bearerAuth:
 *     type: apiKey
 *     name: Authorization
 *     in: header
 *     description: Bearer JWT Token (e.g., "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
 */

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new citizen
 *     description: Create a new citizen account with profile information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *               - aadhaarNumber
 *             properties:
 *               name:
 *                 type: string
 *                 example: "राम शर्मा"
 *                 description: "Full name in Hindi/English"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ram.sharma@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "securePassword123"
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               aadhaarNumber:
 *                 type: string
 *                 example: "123456789012"
 *                 description: "12-digit Aadhaar number"
 *               walletAddress:
 *                 type: string
 *                 example: "0x1234567890abcdef1234567890abcdef12345678"
 *                 description: "Optional Web3 wallet address"
 *     responses:
 *       201:
 *         description: Citizen registered successfully
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
 *                   example: "नागरिक सफलतापूर्वक पंजीकृत हुआ"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     citizen:
 *                       $ref: '#/components/schemas/Citizen'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Citizen already exists
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate citizen
 *     description: Login with email and password to get JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "ram.sharma@example.com"
 *               password:
 *                 type: string
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "लॉगिन सफल"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     citizen:
 *                       $ref: '#/components/schemas/Citizen'
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: Citizen not found
 */

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current citizen profile
 *     description: Retrieve authenticated citizen's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Citizen'
 *       401:
 *         description: Unauthorized - invalid or missing token
 */

// ============================================================================
// CITIZENS MANAGEMENT
// ============================================================================

/**
 * @swagger
 * /api/citizens:
 *   get:
 *     tags:
 *       - Citizens
 *     summary: Get all citizens (Admin only)
 *     description: Retrieve list of all registered citizens with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Citizens list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     citizens:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Citizen'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/citizens/profile:
 *   put:
 *     tags:
 *       - Citizens
 *     summary: Update citizen profile
 *     description: Update authenticated citizen's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "राम कुमार शर्मा"
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               address:
 *                 type: string
 *                 example: "123, मुख्य मार्ग, नई दिल्ली - 110001"
 *               profilePhoto:
 *                 type: string
 *                 description: Base64 encoded image or file path
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "प्रोफ़ाइल अपडेट हो गई"
 *                 data:
 *                   $ref: '#/components/schemas/Citizen'
 */

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

/**
 * @swagger
 * /api/documents:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get citizen's documents
 *     description: Retrieve all documents uploaded by the authenticated citizen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [aadhaar, pan, passport, drivinglicense, other]
 *         description: Filter by document type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 *   post:
 *     tags:
 *       - Documents
 *     summary: Upload a new document
 *     description: Upload and process a new document with OCR and verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, JPG, PNG)
 *               type:
 *                 type: string
 *                 enum: [aadhaar, pan, passport, drivinglicense, other]
 *                 example: "aadhaar"
 *               title:
 *                 type: string
 *                 example: "आधार कार्ड"
 *               description:
 *                 type: string
 *                 example: "पहचान सत्यापन के लिए आधार कार्ड"
 *     responses:
 *       201:
 *         description: Document uploaded successfully
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
 *                   example: "दस्तावेज़ सफलतापूर्वक अपलोड हुआ"
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 */

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get document details
 *     description: Retrieve specific document details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       404:
 *         description: Document not found
 *   put:
 *     tags:
 *       - Documents
 *     summary: Update document
 *     description: Update document details (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "अपडेट किया गया दस्तावेज़"
 *               description:
 *                 type: string
 *                 example: "संशोधित विवरण"
 *     responses:
 *       200:
 *         description: Document updated successfully
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete document
 *     description: Delete a document (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */

/**
 * @swagger
 * /api/documents/{id}/verify:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Verify document (Admin only)
 *     description: Approve or reject document verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
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
 *                 enum: [verified, rejected]
 *                 example: "verified"
 *               remarks:
 *                 type: string
 *                 example: "दस्तावेज़ सत्यापित किया गया"
 *     responses:
 *       200:
 *         description: Document verification updated successfully
 */

// ============================================================================
// GRIEVANCE SYSTEM
// ============================================================================

/**
 * @swagger
 * /api/grievances:
 *   get:
 *     tags:
 *       - Grievances
 *     summary: Get citizen's grievances
 *     description: Retrieve all grievances submitted by the authenticated citizen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, inprogress, resolved, closed]
 *         description: Filter by grievance status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Grievances retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Grievance'
 *   post:
 *     tags:
 *       - Grievances
 *     summary: Submit a new grievance
 *     description: Create a new grievance with AI analysis and categorization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: "सड़क की समस्या"
 *               description:
 *                 type: string
 *                 example: "मेरे क्षेत्र की सड़क में गड्ढे हैं और मरम्मत की आवश्यकता है"
 *               category:
 *                 type: string
 *                 example: "infrastructure"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: "medium"
 *               location:
 *                 type: string
 *                 example: "Block A, Sector 15, Noida"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of file paths or base64 encoded files
 *     responses:
 *       201:
 *         description: Grievance submitted successfully
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
 *                   example: "शिकायत सफलतापूर्वक दर्ज की गई"
 *                 data:
 *                   $ref: '#/components/schemas/Grievance'
 */

/**
 * @swagger
 * /api/grievances/{id}:
 *   get:
 *     tags:
 *       - Grievances
 *     summary: Get grievance details
 *     description: Retrieve specific grievance details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Grievance ID
 *     responses:
 *       200:
 *         description: Grievance details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Grievance'
 *   put:
 *     tags:
 *       - Grievances
 *     summary: Update grievance status (Admin only)
 *     description: Update grievance status and add resolution
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Grievance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, inprogress, resolved, closed]
 *                 example: "resolved"
 *               resolution:
 *                 type: string
 *                 example: "सड़क की मरम्मत कर दी गई है"
 *               adminNotes:
 *                 type: string
 *                 example: "15 दिसंबर को कार्य पूरा हुआ"
 *     responses:
 *       200:
 *         description: Grievance updated successfully
 */

// ============================================================================
// QR CODE SYSTEM
// ============================================================================

/**
 * @swagger
 * /api/qr/generate:
 *   post:
 *     tags:
 *       - QR Codes
 *     summary: Generate QR code for document
 *     description: Create a secure QR code for document verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *             properties:
 *               documentId:
 *                 type: string
 *                 example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *               expiresIn:
 *                 type: number
 *                 example: 3600
 *                 description: Expiry time in seconds (default: 24 hours)
 *     responses:
 *       201:
 *         description: QR code generated successfully
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
 *                   example: "QR कोड सफलतापूर्वक जेनरेट हुआ"
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                     qrData:
 *                       type: string
 *                       description: QR code data/token
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T18:30:00.000Z"
 */

/**
 * @swagger
 * /api/qr/verify/{qrData}:
 *   get:
 *     tags:
 *       - QR Codes
 *     summary: Verify QR code
 *     description: Validate QR code and retrieve document information
 *     parameters:
 *       - in: path
 *         name: qrData
 *         required: true
 *         schema:
 *           type: string
 *         description: QR code data/token to verify
 *     responses:
 *       200:
 *         description: QR code verified successfully
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
 *                   example: "QR कोड सत्यापित"
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       $ref: '#/components/schemas/Document'
 *                     citizen:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "राम शर्मा"
 *                         email:
 *                           type: string
 *                           example: "ram.sharma@example.com"
 *                         isVerified:
 *                           type: boolean
 *                           example: true
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid or expired QR code
 *       404:
 *         description: QR code not found
 */

// ============================================================================
// PAYMENT SYSTEM
// ============================================================================

/**
 * @swagger
 * /api/payments/orders:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment order
 *     description: Create a new payment order for government services
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - serviceType
 *               - description
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500.00
 *                 description: Payment amount in INR
 *               serviceType:
 *                 type: string
 *                 example: "document_verification"
 *                 description: Type of government service
 *               description:
 *                 type: string
 *                 example: "आधार कार्ड सत्यापन शुल्क"
 *               metadata:
 *                 type: object
 *                 properties:
 *                   documentId:
 *                     type: string
 *                   priority:
 *                     type: string
 *                   additionalInfo:
 *                     type: string
 *     responses:
 *       201:
 *         description: Payment order created successfully
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
 *                   example: "भुगतान आदेश बनाया गया"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentOrder'
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get payment history
 *     description: Retrieve payment history for authenticated citizen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         description: Filter by payment status
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentOrder'
 */

/**
 * @swagger
 * /api/payments/orders/{orderId}/verify:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Verify payment
 *     description: Verify payment completion and update order status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - signature
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: "pay_123456789"
 *               signature:
 *                 type: string
 *                 example: "signature_hash_here"
 *               method:
 *                 type: string
 *                 example: "card"
 *     responses:
 *       200:
 *         description: Payment verified successfully
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
 *                   example: "भुगतान सफलतापूर्वक सत्यापित"
 *                 data:
 *                   $ref: '#/components/schemas/PaymentOrder'
 */

// ============================================================================
// WEB3 BLOCKCHAIN INTEGRATION
// ============================================================================

/**
 * @swagger
 * /api/web3/contract-info:
 *   get:
 *     tags:
 *       - Web3/Blockchain
 *     summary: Get smart contract information
 *     description: Retrieve deployed smart contract addresses and network info
 *     responses:
 *       200:
 *         description: Contract information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     citizenRegistry:
 *                       type: string
 *                       example: "0x1234567890abcdef1234567890abcdef12345678"
 *                     documentRegistry:
 *                       type: string
 *                       example: "0xabcdef1234567890abcdef1234567890abcdef12"
 *                     grievanceSystem:
 *                       type: string
 *                       example: "0x567890abcdef1234567890abcdef1234567890ab"
 *                     network:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Hardhat Network"
 *                         chainId:
 *                           type: number
 *                           example: 1337
 *                         rpcUrl:
 *                           type: string
 *                           example: "http://127.0.0.1:8545"
 */

/**
 * @swagger
 * /api/web3/register-citizen:
 *   post:
 *     tags:
 *       - Web3/Blockchain
 *     summary: Register citizen on blockchain
 *     description: Register citizen identity on the blockchain smart contract
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 example: "0x1234567890abcdef1234567890abcdef12345678"
 *               transactionHash:
 *                 type: string
 *                 example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"
 *     responses:
 *       200:
 *         description: Citizen registered on blockchain successfully
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
 *                   example: "नागरिक ब्लॉकचेन पर पंजीकृत हुआ"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionHash:
 *                       type: string
 *                     blockNumber:
 *                       type: number
 *                     gasUsed:
 *                       type: string
 */

/**
 * @swagger
 * /api/web3/register-document:
 *   post:
 *     tags:
 *       - Web3/Blockchain
 *     summary: Register document on blockchain
 *     description: Register document hash on blockchain for immutable verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *               - documentHash
 *             properties:
 *               documentId:
 *                 type: string
 *                 example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *               documentHash:
 *                 type: string
 *                 example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"
 *               transactionHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document registered on blockchain successfully
 */

// ============================================================================
// AI SERVICES
// ============================================================================

/**
 * @swagger
 * /api/ai/analyze-document:
 *   post:
 *     tags:
 *       - AI Services
 *     summary: Analyze document with OCR
 *     description: Extract text and analyze document content using AI/OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to analyze
 *               language:
 *                 type: string
 *                 example: "hi+en"
 *                 description: OCR language (Hindi + English)
 *     responses:
 *       200:
 *         description: Document analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     extractedText:
 *                       type: string
 *                       example: "आधार संख्या: 1234 5678 9012..."
 *                     documentType:
 *                       type: string
 *                       example: "aadhaar"
 *                     confidence:
 *                       type: number
 *                       example: 0.95
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         fields:
 *                           type: object
 *                         validity:
 *                           type: boolean
 *                         suggestions:
 *                           type: array
 *                           items:
 *                             type: string
 */

/**
 * @swagger
 * /api/ai/analyze-grievance:
 *   post:
 *     tags:
 *       - AI Services
 *     summary: Analyze grievance content
 *     description: Categorize and analyze grievance using AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "सड़क की समस्या"
 *               description:
 *                 type: string
 *                 example: "मेरे क्षेत्र की सड़क में गड्ढे हैं"
 *     responses:
 *       200:
 *         description: Grievance analyzed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       example: "infrastructure"
 *                     priority:
 *                       type: string
 *                       example: "medium"
 *                     department:
 *                       type: string
 *                       example: "Public Works Department"
 *                     estimatedResolutionTime:
 *                       type: string
 *                       example: "15-30 days"
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Citizen:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *         name:
 *           type: string
 *           example: "राम शर्मा"
 *         email:
 *           type: string
 *           example: "ram.sharma@example.com"
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         aadhaarNumber:
 *           type: string
 *           example: "123456789012"
 *         walletAddress:
 *           type: string
 *           example: "0x1234567890abcdef1234567890abcdef12345678"
 *         isVerified:
 *           type: boolean
 *           example: true
 *         profilePhoto:
 *           type: string
 *           example: "/uploads/profiles/citizen_123.jpg"
 *         address:
 *           type: string
 *           example: "123, मुख्य मार्ग, नई दिल्ली - 110001"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *         title:
 *           type: string
 *           example: "आधार कार्ड"
 *         type:
 *           type: string
 *           enum: [aadhaar, pan, passport, drivinglicense, other]
 *           example: "aadhaar"
 *         description:
 *           type: string
 *           example: "पहचान सत्यापन के लिए आधार कार्ड"
 *         filePath:
 *           type: string
 *           example: "/uploads/documents/doc_123.pdf"
 *         fileSize:
 *           type: number
 *           example: 2048576
 *         mimeType:
 *           type: string
 *           example: "application/pdf"
 *         citizenId:
 *           type: string
 *           example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *         status:
 *           type: string
 *           enum: [pending, verified, rejected]
 *           example: "verified"
 *         verificationRemarks:
 *           type: string
 *           example: "दस्तावेज़ सत्यापित किया गया"
 *         ocrData:
 *           type: object
 *           properties:
 *             extractedText:
 *               type: string
 *             confidence:
 *               type: number
 *         blockchainHash:
 *           type: string
 *           example: "0xabcdef1234567890..."
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Grievance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *         title:
 *           type: string
 *           example: "सड़क की समस्या"
 *         description:
 *           type: string
 *           example: "मेरे क्षेत्र की सड़क में गड्ढे हैं"
 *         category:
 *           type: string
 *           example: "infrastructure"
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           example: "medium"
 *         status:
 *           type: string
 *           enum: [pending, inprogress, resolved, closed]
 *           example: "pending"
 *         citizenId:
 *           type: string
 *           example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *         location:
 *           type: string
 *           example: "Block A, Sector 15, Noida"
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           example: ["/uploads/grievances/attachment1.jpg"]
 *         resolution:
 *           type: string
 *           example: "सड़क की मरम्मत कर दी गई है"
 *         adminNotes:
 *           type: string
 *           example: "15 दिसंबर को कार्य पूरा हुआ"
 *         aiAnalysis:
 *           type: object
 *           properties:
 *             suggestedCategory:
 *               type: string
 *             priorityScore:
 *               type: number
 *             department:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     PaymentOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *         orderId:
 *           type: string
 *           example: "order_123456789"
 *         amount:
 *           type: number
 *           example: 500.00
 *         currency:
 *           type: string
 *           example: "INR"
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *           example: "completed"
 *         serviceType:
 *           type: string
 *           example: "document_verification"
 *         description:
 *           type: string
 *           example: "आधार कार्ड सत्यापन शुल्क"
 *         citizenId:
 *           type: string
 *           example: "64f9b9c5e5d4c8b8e5d4c8b8"
 *         paymentId:
 *           type: string
 *           example: "pay_123456789"
 *         paymentMethod:
 *           type: string
 *           example: "card"
 *         metadata:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: number
 *           example: 1
 *         totalPages:
 *           type: number
 *           example: 10
 *         totalItems:
 *           type: number
 *           example: 95
 *         itemsPerPage:
 *           type: number
 *           example: 10
 *         hasNext:
 *           type: boolean
 *           example: true
 *         hasPrev:
 *           type: boolean
 *           example: false
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Validation Error"
 *         message:
 *           type: string
 *           example: "आवश्यक फील्ड गायब हैं"
 *         details:
 *           type: object
 *           properties:
 *             field:
 *               type: string
 *               example: "email"
 *             code:
 *               type: string
 *               example: "REQUIRED"
 *         timestamp:
 *           type: string
 *           format: date-time
 *         path:
 *           type: string
 *           example: "/api/auth/register"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT Bearer Token obtained from login endpoint
 */

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'BharatChain API',
    version: '1.0.0',
    description: `
    # BharatChain Government Digital Identity Platform API
    
    ## Overview
    BharatChain is a comprehensive government digital identity platform that combines 
    blockchain technology, AI-powered document processing, and modern web technologies 
    to provide secure, transparent, and efficient citizen services.
    
    ## Features
    - 🔐 **Secure Authentication** - JWT-based authentication system
    - 📄 **Document Management** - Upload, verify, and manage government documents
    - 🤖 **AI-Powered OCR** - Automatic text extraction and document analysis
    - 📱 **QR Code Verification** - Secure document verification via QR codes
    - 💰 **Payment Integration** - Government service fee processing
    - ⛓️ **Blockchain Integration** - Immutable document and identity registration
    - 📋 **Grievance System** - AI-categorized complaint management
    - 🔍 **Real-time Tracking** - Status updates and notifications
    
    ## Authentication
    Most endpoints require authentication using Bearer JWT tokens. Include the token in the Authorization header:
    \`Authorization: Bearer YOUR_JWT_TOKEN\`
    
    ## Response Format
    All API responses follow a consistent format:
    \`\`\`json
    {
      "success": true|false,
      "message": "Response message in Hindi/English",
      "data": { ... response data ... },
      "error": "Error message (if any)"
    }
    \`\`\`
    
    ## Error Codes
    - **400** - Bad Request (validation errors)
    - **401** - Unauthorized (invalid/missing token)
    - **403** - Forbidden (insufficient permissions)
    - **404** - Not Found (resource not found)
    - **409** - Conflict (resource already exists)
    - **500** - Internal Server Error
    
    ## Rate Limiting
    API requests are limited to prevent abuse. Current limits:
    - Authentication endpoints: 5 requests per minute
    - General API endpoints: 100 requests per minute
    - File upload endpoints: 10 requests per minute
    
    ## Development Environment
    - **Base URL**: http://localhost:5000/api
    - **WebSocket**: ws://localhost:5000
    - **Blockchain Network**: Hardhat Local (chainId: 1337)
    - **AI Service**: Python Flask (localhost:8000)
    `,
    contact: {
      name: 'BharatChain Support',
      email: 'support@bharatchain.gov.in',
      url: 'https://bharatchain.gov.in'
    },
    license: {
      name: 'Government of India License',
      url: 'https://bharatchain.gov.in/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    },
    {
      url: 'https://api.bharatchain.gov.in',
      description: 'Production Server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and profile management'
    },
    {
      name: 'Citizens',
      description: 'Citizen profile and data management'
    },
    {
      name: 'Documents',
      description: 'Document upload, verification, and management'
    },
    {
      name: 'Grievances',
      description: 'Citizen grievance submission and tracking'
    },
    {
      name: 'QR Codes',
      description: 'QR code generation and verification for documents'
    },
    {
      name: 'Payments',
      description: 'Government service payment processing'
    },
    {
      name: 'Web3/Blockchain',
      description: 'Blockchain integration and smart contract interactions'
    },
    {
      name: 'AI Services',
      description: 'AI-powered document analysis and grievance categorization'
    }
  ]
};

console.log('📚 BharatChain API Documentation Generated');
console.log('✅ Complete Swagger/OpenAPI 3.0 documentation');
console.log('🔍 Includes all endpoints with detailed examples');
console.log('🔐 Authentication and security schemes documented');
console.log('📊 Response schemas and error handling covered');
console.log('🌐 Hindi and English descriptions provided');
console.log('💡 Developer adoption ready with comprehensive examples');