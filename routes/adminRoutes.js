const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

router.use(authMiddleware, adminMiddleware);

// ─── Overview ──────────────────────────────────────────────
router.get("/stats", adminController.stats);

// ─── Users ─────────────────────────────────────────────────
router.get("/users", adminController.listUsers);

// ─── Albums ────────────────────────────────────────────────
router.get("/albums",                 adminController.listAlbums);
router.get("/albums/:id",             adminController.getAlbum);
router.patch("/albums/:id",           adminController.updateAlbum);
router.patch("/albums/:id/publish",   adminController.publishAlbum);
router.patch("/albums/:id/feature",   adminController.featureAlbum);
router.patch("/albums/:id/soft-delete", adminController.softDeleteAlbum);

module.exports = router;