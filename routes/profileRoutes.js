const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const { authMiddleware, emailVerifiedMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: User profile management
 */

// ─── Public ────────────────────────────────────────────────

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: List all profiles
 *     tags: [Profiles]
 */
router.get('/', profileController.getAllProfiles);

// ─── Self routes (static) — MUST be before /:id ────────────

/**
 * @swagger
 * /api/profiles/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profiles]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/me", authMiddleware, emailVerifiedMiddleware, profileController.getMyProfile);

router.post("/", authMiddleware, emailVerifiedMiddleware, profileController.createProfile);

router.put("/me", authMiddleware, emailVerifiedMiddleware, profileController.updateMyProfile);

router.delete("/me", authMiddleware, emailVerifiedMiddleware, profileController.deleteMyProfile);

// ─── Dynamic route last ────────────────────────────────────

/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: Get profile by ID
 *     tags: [Profiles]
 */
router.get('/:id', profileController.getProfileById);

module.exports = router;