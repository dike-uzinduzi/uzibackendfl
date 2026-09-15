const express = require("express");
const paymentController = require("../controllers/paymentController");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */

/**
 * @swagger
 * /api/payments/currencies:
 *   get:
 *     summary: Get active currencies from Pesepay
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active currencies
 */
router.get("/currencies", authMiddleware, paymentController.getActiveCurrencies);

/**
 * @swagger
 * /api/payments/payment-methods:
 *   get:
 *     summary: Get payment methods for a currency from Pesepay
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currencyCode
 *         schema:
 *           type: string
 *           default: USD
 *         description: Currency code
 *     responses:
 *       200:
 *         description: List of payment methods
 */
router.get("/payment-methods", authMiddleware, paymentController.getPaymentMethods);

/**
 * @swagger
 * /api/payments/purchase:
 *   post:
 *     summary: Initiate plaque purchase (Redirect Method)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - albumId
 *               - plaqueType
 *               - amount
 *               - phone
 *               - currencyCode
 *             properties:
 *               albumId:
 *                 type: string
 *                 example: "64f8a1b2c3d4e5f6a7b8c9d2"
 *               plaqueType:
 *                 type: string
 *                 example: Gold
 *               amount:
 *                 type: number
 *                 example: 1.50
 *               phone:
 *                 type: string
 *                 example: "+263771234567"
 *               currencyCode:
 *                 type: string
 *                 example: USD
 *     responses:
 *       200:
 *         description: Payment initiated (returns redirectUrl and referenceNumber)
 */
router.post("/purchase", authMiddleware, paymentController.initiatePurchase);

/**
 * @swagger
 * /api/payments/purchase-seamless:
 *   post:
 *     summary: Initiate plaque purchase (Seamless Method)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - albumId
 *               - plaqueType
 *               - amount
 *               - phone
 *               - paymentMethodCode
 *               - currencyCode
 *             properties:
 *               albumId:
 *                 type: string
 *                 example: "64f8a1b2c3d4e5f6a7b8c9d2"
 *               plaqueType:
 *                 type: string
 *                 example: Gold
 *               amount:
 *                 type: number
 *                 example: 1.50
 *               phone:
 *                 type: string
 *                 example: "+263771234567"
 *               paymentMethodCode:
 *                 type: string
 *                 example: "PZW211"
 *               currencyCode:
 *                 type: string
 *                 example: USD
 *               requiredFields:
 *                 type: object
 *                 example: {}
 *     responses:
 *       200:
 *         description: Payment initiated (returns pollUrl + referenceNumber)
 *       400:
 *         description: Bad Request
 */
router.post("/purchase-seamless", authMiddleware, paymentController.initiateSeamlessPurchase);

/**
 * @swagger
 * /api/payments/innbucks:
 *   post:
 *     summary: Initiate InnBucks seamless payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - albumId
 *               - plaqueType
 *               - amount
 *               - phone
 *               - currencyCode
 *             properties:
 *               albumId:
 *                 type: string
 *                 example: "64f8a1b2c3d4e5f6a7b8c9d2"
 *               plaqueType:
 *                 type: string
 *                 example: Gold
 *               amount:
 *                 type: number
 *                 example: 3.00
 *               phone:
 *                 type: string
 *                 example: "+263773456789"
 *               currencyCode:
 *                 type: string
 *                 example: USD
 *               requiredFields:
 *                 type: object
 *                 example: {}
 *     responses:
 *       200:
 *         description: InnBucks payment initiated
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post("/innbucks", authMiddleware, paymentController.initiateInnbucksPurchase);


/**
 * @swagger
 * /api/payments/pesepay/callback:
 *   post:
 *     summary: Pesepay payment callback (Webhook)
 *     tags: [Payments]
 *     description: Receives the webhook from Pesepay.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referenceNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Callback received
 */
router.post("/pesepay/callback", paymentController.handlePesepayCallback);

/**
 * @swagger
 * /api/payments/status/{referenceNumber}:
 *   get:
 *     summary: Get unified payment status by reference number
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referenceNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 *       404:
 *         description: Payment not found
 */
router.get("/status/:referenceNumber", authMiddleware, paymentController.checkPaymentStatus);

/**
 * @swagger
 * /api/payments/poll-status:
 *   post:
 *     summary: Check payment status by poll URL
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pollUrl:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Poll response
 */
router.post("/poll-status", authMiddleware, paymentController.pollPaymentStatus);

/**
 * @swagger
 * /api/payments/purchases:
 *   get:
 *     summary: Get user's purchase history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchases retrieved
 */
router.get("/purchases", authMiddleware, paymentController.getUserPurchases);

/**
 * @swagger
 * /api/payments/my-awarded-plaques:
 *   get:
 *     summary: Get current user's awarded plaques
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Awarded plaques retrieved
 */
router.get("/my-awarded-plaques", authMiddleware, paymentController.getMyAwardedPlaques);

/**
 * @swagger
 * /api/payments/verify/{referenceNumber}:
 *   post:
 *     summary: Manually verify a payment (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referenceNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verification complete
 */
router.post(
  "/verify/:referenceNumber",
  authMiddleware,
  adminMiddleware,
  paymentController.verifyTransaction
);

/**
 * @swagger
 * /api/payments/{id}/notify-failed:
 *   post:
 *     summary: Send failure notification email (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification sent
 *       404:
 *         description: Payment not found
 */
router.post(
  "/:id/notify-failed",
  authMiddleware,
  adminMiddleware,
  paymentController.notifyTransactionFailed
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payments
 */
router.get("/", authMiddleware, adminMiddleware, paymentController.getAllPayments);

module.exports = router;