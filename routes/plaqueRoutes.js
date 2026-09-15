const express = require("express");
const plaqueController = require("../controllers/plaqueController");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Plaques
 *   description: Plaque purchase management endpoints
 */

/**
 * @swagger
 * /api/plaques/me:
 *   get:
 *     summary: Get current user's plaques
 *     tags: [Plaques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plaques retrieved
 */
router.get("/me", authMiddleware, plaqueController.getMyPlaques);
/**
 * @swagger
 * /api/plaques:
 *   get:
 *     summary: Get all plaque purchases
 *     tags: [Plaques]
 *     responses:
 *       200:
 *         description: Plaques retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plaques:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plaque'
 */
router.get("/", plaqueController.getAllPlaques);

/**
 * @swagger
 * /api/plaques/user/{userId}:
 *   get:
 *     summary: Get plaque purchases by user ID
 *     tags: [Plaques]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User plaques retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plaques:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plaque'
 */
router.get("/user/:userId", plaqueController.getPlaquesByUser);
router.get("/verify/:serialNumber", plaqueController.verifyPlaque.bind(plaqueController));
/**
 * @swagger
 * /api/plaques/{id}:
 *   get:
 *     summary: Get plaque purchase by ID
 *     tags: [Plaques]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaque purchase ID
 *     responses:
 *       200:
 *         description: Plaque retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plaque:
 *                   $ref: '#/components/schemas/Plaque'
 *       404:
 *         description: Plaque purchase not found
 */
router.get("/:id", plaqueController.getPlaqueById);

/**
 * @swagger
 * /api/plaques:
 *   post:
 *     summary: Purchase a plaque
 *     tags: [Plaques]
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
 *               - plaqueImage
 *               - amount
 *               - paymentMethod
 *             properties:
 *               albumId:
 *                 type: string
 *                 example: "64f8a1b2c3d4e5f6a7b8c9d2"
 *               plaqueType:
 *                 type: string
 *                 example: "Gold Plaque"
 *               plaqueImage:
 *                 type: string
 *                 example: "https://example.com/images/gold-plaque-design.jpg"
 *               amount:
 *                 type: number
 *                 example: 150
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, mobile_money, bank_transfer, cash, paypal, other]
 *                 example: "mobile_money"
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, cancelled]
 *                 example: "pending"
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - line1
 *                   - city
 *                   - country
 *                 properties:
 *                   line1:
 *                     type: string
 *                     example: "123 Music Street"
 *                   line2:
 *                     type: string
 *                     example: "Apt 4B"
 *                   city:
 *                     type: string
 *                     example: "Harare"
 *                   state:
 *                     type: string
 *                     example: "Harare Province"
 *                   postalCode:
 *                     type: string
 *                     example: "00263"
 *                   country:
 *                     type: string
 *                     example: "Zimbabwe"
 *     responses:
 *       201:
 *         description: Plaque purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 plaque:
 *                   $ref: '#/components/schemas/Plaque'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, plaqueController.createPlaque);

/**
 * @swagger
 * /api/plaques/{id}:
 *   put:
 *     summary: Update plaque purchase
 *     tags: [Plaques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaque purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plaqueType:
 *                 type: string
 *                 example: "Platinum Plaque"
 *               plaqueImage:
 *                 type: string
 *                 example: "https://example.com/images/platinum-plaque-design.jpg"
 *               amount:
 *                 type: number
 *                 example: 250
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, mobile_money, bank_transfer, cash, paypal, other]
 *                 example: "card"
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, paid, failed, cancelled]
 *                 example: "paid"
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   line1:
 *                     type: string
 *                     example: "456 Music Avenue"
 *                   line2:
 *                     type: string
 *                     example: "Suite 200"
 *                   city:
 *                     type: string
 *                     example: "Bulawayo"
 *                   state:
 *                     type: string
 *                     example: "Bulawayo Province"
 *                   postalCode:
 *                     type: string
 *                     example: "00263"
 *                   country:
 *                     type: string
 *                     example: "Zimbabwe"
 *     responses:
 *       200:
 *         description: Plaque updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 plaque:
 *                   $ref: '#/components/schemas/Plaque'
 *       404:
 *         description: Plaque purchase not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", authMiddleware, plaqueController.updatePlaque);

/**
 * @swagger
 * /api/plaques/{id}:
 *   delete:
 *     summary: Delete plaque purchase
 *     tags: [Plaques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaque purchase ID
 *     responses:
 *       200:
 *         description: Plaque purchase deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Plaque purchase not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", authMiddleware, plaqueController.deletePlaque);
/**
 * @swagger
 * /api/plaques/{id}/finalize:
 *   post:
 *     summary: Finalize plaque purchase and generate blockchain hash (Admin)
 *     tags: [Plaques]
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
 *         description: Plaque finalized
 */
router.post("/:id/finalize", authMiddleware, adminMiddleware, plaqueController.finalizePlaque);

module.exports = router;
