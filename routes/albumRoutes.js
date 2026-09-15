const express = require("express");
const router = express.Router();

const albumController = require("../controllers/albumController");
const supportController = require("../controllers/supportController");
const { authMiddleware, artistMiddleware } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Albums
 *     description: Album management endpoints
 */

// ─── Static routes (must come before /:id) ──────────────────
router.get("/",             albumController.getAllAlbums);
router.get("/newest",       albumController.getNewestAlbums);
router.get("/stats",        albumController.getDashboardStats);
router.get("/featured",     albumController.getFeaturedAlbum);
router.get("/my-albums",    authMiddleware, artistMiddleware, albumController.getMyAlbums);

// ─── Write operations ──────────────────────────────────────
router.post  ("/",  authMiddleware, artistMiddleware, albumController.createAlbum);
router.put   ("/:id", authMiddleware, artistMiddleware, albumController.updateAlbum);
router.delete("/:id", authMiddleware, artistMiddleware, albumController.deleteAlbum);

// ─── Plaque array sub-resources ────────────────────────────
router.post  ("/:id/plaques",                    authMiddleware, artistMiddleware, albumController.addPlaque);
router.put   ("/:id/plaques/:plaqueIndex",       authMiddleware, artistMiddleware, albumController.updatePlaque);
router.delete("/:id/plaques/:plaqueIndex",       authMiddleware, artistMiddleware, albumController.deletePlaque);

// ─── Support ────────────────────────────────────────────────
router.post("/:albumId/support", authMiddleware, supportController.support);

// ─── Dynamic route last ─────────────────────────────────────
router.get("/:id", albumController.getAlbumById);

module.exports = router;