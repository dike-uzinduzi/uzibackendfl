const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const {
  followArtist,
  unfollowArtist,
  getFanFeed,
  getFanStats,
} = require("../controllers/engagementController");

// All engagement routes require auth
router.use(authMiddleware);

// ─── Follow / unfollow ─────────────────────────────────────
router.post  ("/artists/:artistId/follow", followArtist);
router.delete("/artists/:artistId/follow", unfollowArtist);

// ─── Fan dashboard ─────────────────────────────────────────
router.get("/feed",  getFanFeed);
router.get("/stats", getFanStats);

module.exports = router;