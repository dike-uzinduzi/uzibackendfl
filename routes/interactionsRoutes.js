const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/interactionsController");

/**
 * @swagger
 * tags:
 *   name: Interactions
 *   description: Likes, views, and interaction summaries for albums/tracks
 */

/**
 * @swagger
 * /api/interactions/tracks/{trackId}/like:
 *   post:
 *     summary: Toggle like for a track (like/unlike)
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: string
 *         description: Track ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 liked:
 *                   type: boolean
 *                   example: true
 *                 likeCount:
 *                   type: integer
 *                   example: 12
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Track not found
 *       500:
 *         description: Server error
 */
router.post("/tracks/:trackId/like", authMiddleware, ctrl.toggleTrackLike);

/**
 * @swagger
 * /api/interactions/albums/{albumId}/view:
 *   post:
 *     summary: Register a view for an album
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *         description: Album ID
 *     responses:
 *       200:
 *         description: View registered (or ignored if anti-spam hits)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 viewed:
 *                   type: boolean
 *                   example: true
 *                 viewCount:
 *                   type: integer
 *                   example: 140
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
router.post("/albums/:albumId/view", authMiddleware, ctrl.registerAlbumView);

/**
 * @swagger
 * /api/interactions/albums/{albumId}/summary:
 *   get:
 *     summary: Get album interaction summary (views + likes per track + user's liked tracks)
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Interaction summary returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 album:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "a1b2c3"
 *                     title:
 *                       type: string
 *                       example: "Risky Life 3"
 *                     viewCount:
 *                       type: integer
 *                       example: 140
 *                 tracks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "t1"
 *                       title:
 *                         type: string
 *                         example: "Intro"
 *                       likeCount:
 *                         type: integer
 *                         example: 12
 *                       likedByUser:
 *                         type: boolean
 *                         example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
router.get(
  "/albums/:albumId/summary",
  authMiddleware,
  ctrl.getAlbumInteractionSummary
);

module.exports = router;
