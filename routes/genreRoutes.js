const express = require('express');
const router = express.Router();

const genreController = require('../controllers/genreController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// ─── Public ────────────────────────────────────────────────
router.get('/',     genreController.getAllGenres);

// ─── Admin write ───────────────────────────────────────────
router.post(  '/',    authMiddleware, adminMiddleware, genreController.createGenre);
router.put(   '/:id', authMiddleware, adminMiddleware, genreController.updateGenre);
router.delete('/:id', authMiddleware, adminMiddleware, genreController.deleteGenre);

// ─── Dynamic route last ────────────────────────────────────
router.get('/:id', genreController.getGenreById);

module.exports = router;