const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const emailService = require("../services/emailService");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

// ─── Static routes first ────────────────────────────────────

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get("/", authMiddleware, adminMiddleware, userController.getAllUsers);

/**
 * @swagger
 * /api/users/test-email:
 *   post:
 *     summary: Test email service (dev + admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test email sent
 */
if (process.env.NODE_ENV !== "production") {
  router.post("/test-email", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      const otp = emailService.generateOTP();
      const result = await emailService.sendOTPEmail(email, otp, name || "Test User");

      res.json({
        success: result,
        message: result ? "Test email sent successfully" : "Failed to send test email",
        otp,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

// ─── Write operations ──────────────────────────────────────

router.post  ("/",     authMiddleware, userController.createUser);
router.put   ("/:id",  authMiddleware, userController.updateUser);
router.delete("/:id",  authMiddleware, userController.deleteUser);

// ─── Admin sub-resource ────────────────────────────────────

/**
 * @swagger
 * /api/users/{id}/notify:
 *   post:
 *     summary: Send notification email to a user
 *     tags: [Users]
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
 *         description: Notification sent successfully
 */
router.post(
  "/:id/notify",
  authMiddleware,
  adminMiddleware,
  userController.notifyUser
);

// ─── Dynamic route last ────────────────────────────────────

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (self, admin, or public profile)
 *     tags: [Users]
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
 *         description: User retrieved successfully
 */
router.get("/:id", authMiddleware, userController.getUserById);

module.exports = router;