const express = require('express');
const router = express.Router();

const newsController = require('../controllers/newsController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: News
 *   description: News management
 */

// ─── Public static routes ──────────────────────────────────
router.get('/',                    newsController.getAllNews);
router.get('/category/:category',  newsController.getNewsByCategory);
router.get('/stats',               newsController.getNewsStats);

// ─── Admin write operations ────────────────────────────────
router.post  ('/',    authMiddleware, adminMiddleware, newsController.createNews);
router.put   ('/:id', authMiddleware, adminMiddleware, newsController.updateNews);
router.delete('/:id', authMiddleware, adminMiddleware, newsController.deleteNews);

// ─── Dynamic route last ────────────────────────────────────
router.get('/:id', newsController.getNewsById);

module.exports = router;