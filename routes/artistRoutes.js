const express = require('express');
const router = express.Router();

const artistController = require('../controllers/artistController');
const {
  authMiddleware,
  adminMiddleware,
  artistMiddleware,
} = require('../middleware/authMiddleware');

// ─── Public ────────────────────────────────────────────────
router.get('/', artistController.getAllArtists);

// ─── Self route (MUST be before /:id) ──────────────────────
router.get('/me', authMiddleware, artistMiddleware, artistController.getMyArtist);

// ─── Admin create / delete ─────────────────────────────────
router.post  ('/',    authMiddleware, adminMiddleware, artistController.createArtist);
router.delete('/:id', authMiddleware, adminMiddleware, artistController.deleteArtist);

// ─── Update: admin or self (ownership checked in controller) ─
router.put(
  '/:id',
  authMiddleware,
  (req, res, next) => {
    const allowed = ['admin', 'super_admin', 'artist'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  },
  artistController.updateArtist
);

// ─── Dynamic route last ────────────────────────────────────
router.get('/:id', artistController.getArtistById);

module.exports = router;