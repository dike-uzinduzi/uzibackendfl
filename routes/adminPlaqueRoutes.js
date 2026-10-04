const express = require("express");
const router = express.Router();

const adminPlaqueController = require("../controllers/adminPlaqueController");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware, adminMiddleware);

// List with filters + pagination
router.get("/", adminPlaqueController.list);

// Detail (with related owner/album/artist)
router.get("/:id", adminPlaqueController.get);

// Status transition (validated server-side)
router.patch("/:id/status", adminPlaqueController.updateStatus);

// Admin notes
router.patch("/:id/notes", adminPlaqueController.updateNotes);

// Shipping updates
router.patch("/:id/shipping", adminPlaqueController.updateShipping);

module.exports = router;