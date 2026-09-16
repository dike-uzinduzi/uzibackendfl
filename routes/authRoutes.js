require("dotenv").config(); 
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  authMiddleware,
  superAdminMiddleware,
  allowSignupPending,
} = require("../middleware/authMiddleware");

// Block corporate role on normal register
const blockCorporateOnNormalRegister = (req, res, next) => {
  if ((req.body?.role || "").toLowerCase() === "corporate") {
    return res.status(400).json({
      success: false,
      message: "Corporate accounts must register via /api/auth/register-corporate",
    });
  }
  next();
};

/**
 * =========================
 * NORMAL AUTH ROUTES
 * =========================
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               userName:
 *                 type: string
 *                 example: "newuser123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newuser@uzi.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *               role:
 *                 type: string
 *                 enum: [fan, artist]
 *                 example: "fan"
 *     responses:
 *       201:
 *         description: User registered successfully. OTP sent to email for verification.
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post("/register", blockCorporateOnNormalRegister, authController.register);
// force corporate role (ignore whatever client sends)
const forceCorporateRole = (req, res, next) => {
  req.body.role = "corporate";
  next();
};

/**
 * @swagger
 * /api/auth/register-corporate:
 *   post:
 *     summary: Register a new corporate user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userName, email, password]
 *             properties:
 *               userName:
 *                 type: string
 *                 example: "acme_corp"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@acme.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *     responses:
 *       201:
 *         description: Corporate user registered successfully. OTP sent to email for verification.
 */
router.post("/register-corporate", forceCorporateRole, authController.register);
/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newuser@uzi.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-email", authController.verifyEmail);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP for email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newuser@uzi.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: User not found or already verified
 */
router.post("/resend-otp", authController.resendOTP);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
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
 *                 example: "user@uzi.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get("/me", authMiddleware, authController.getCurrentUser);


/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@uzi.com"
 *     responses:
 *       200:
 *         description: OTP sent to email for password reset
 *       400:
 *         description: User not found
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@uzi.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /api/auth/admin/request-creation-otp:
 *   post:
 *     summary: Request OTP for admin account creation (Super Admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - email
 *               - password
 *             properties:
 *               userName:
 *                 type: string
 *                 example: "newadmin"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@uzi.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "AdminPass123!"
 *     responses:
 *       200:
 *         description: OTP sent to super admin for verification
 *       400:
 *         description: Invalid data or user already exists
 *       403:
 *         description: Only super admin can create admin accounts
 */
router.post(
  "/admin/request-creation-otp",
  authMiddleware,
  superAdminMiddleware,
  authController.requestAdminCreationOTP,
);

/**
 * @swagger
 * /api/auth/admin/verify-creation-otp:
 *   post:
 *     summary: Verify OTP and create admin account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Admin account created successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/admin/verify-creation-otp", authController.verifyAdminCreationOTP);


// ... existing routes unchanged ...

/**
 * @swagger
 * /api/auth/social-login:
 *   post:
 *     summary: Sign in with a Google ID token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: "The idToken returned by google_sign_in on the client"
 *     responses:
 *       200:
 *         description: |
 *           If `needsCompletion` is true, the returned token is a short-lived
 *           "signup_pending" token and the client must POST /social-complete.
 *       401:
 *         description: Invalid Google token
 */
router.post("/social-login", authController.socialLogin);

/**
 * /api/auth/social-complete — CHANGED:
 *   - only accepts signup_pending tokens (not full session tokens)
 */
router.patch(
  "/social-complete",
  allowSignupPending,      // ← must run BEFORE authMiddleware
  authMiddleware,
  authController.socialComplete
);

// All other authenticated routes should reject signup_pending tokens:
// add `rejectSignupPending` after authMiddleware wherever you want to enforce it.

module.exports = router;
