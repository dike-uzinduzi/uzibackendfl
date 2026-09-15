const express = require('express');
const router = express.Router();

const trackController = require('../controllers/trackController');
const { authMiddleware, artistMiddleware } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Tracks
 *   description: Track management
 */

// ── Public static routes ───────────────────────────────────
router.get('/',                 trackController.getAllTracks);
router.get('/album/:albumId',   trackController.getTracksByAlbum);

/**
 * @swagger
 * /api/tracks/stats:
 *   get:
 *     summary: Track counts for admin dashboard
 *     tags: [Tracks]
 */
router.get('/stats', async (req, res) => {
  try {
    const { Track } = require('../models');
    const total     = await Track.count({ where: { isDeleted: false } });
    const published = await Track.count({ where: { isDeleted: false, isPublished: true } });
    res.json({ success: true, total, published });
  } catch (err) {
    console.error('getTrackStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Bulk (MUST be before /:id) ─────────────────────────────
router.post('/bulk', authMiddleware, artistMiddleware, async (req, res) => {
  try {
    const { Track } = require('../models');
    const trackService = require('../services/trackService');

    const tracks = req.body;
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ success: false, message: 'Tracks array is required' });
    }
    if (tracks.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 tracks per bulk request' });
    }

    const cleaned = tracks.map((t) => {
      const track = { ...t };
      if (!track.id) delete track.id;
      return track;
    });

    const albumIds = new Set(cleaned.map((t) => t.albumId).filter(Boolean));
    if (albumIds.size === 0) {
      return res.status(400).json({ success: false, message: 'Every track must have an albumId' });
    }

    const created = await Track.bulkCreate(cleaned, { validate: true });

    for (const albumId of albumIds) {
      await trackService._recomputeAlbumCounters(albumId);
    }

    res.status(201).json({ success: true, count: created.length, tracks: created });
  } catch (error) {
    console.error('Bulk create tracks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Param routes ───────────────────────────────────────────
router.get(   '/:id',  trackController.getTrackById);
router.post(  '/',     authMiddleware, artistMiddleware, trackController.createTrack);
router.put(   '/:id',  authMiddleware, artistMiddleware, trackController.updateTrack);
router.delete('/:id',  authMiddleware, artistMiddleware, trackController.deleteTrack);

module.exports = router;