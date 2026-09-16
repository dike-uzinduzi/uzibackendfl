const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const {
  followArtist,
  unfollowArtist,
  getFanFeed,
  getFanStats,
  markActivityRead,
  markAllActivitiesRead,
  getUnreadCount,
} = require("../controllers/engagementController");

// All engagement routes require auth
router.use(authMiddleware);

// ─── Follow / unfollow ─────────────────────────────────────
router.post  ("/artists/:artistId/follow", followArtist);
router.delete("/artists/:artistId/follow", unfollowArtist);

// ─── Fan dashboard ─────────────────────────────────────────
router.get("/feed",  getFanFeed);
router.get("/stats", getFanStats);
router.get  ("/activities/unread-count", getUnreadCount);
router.patch("/activities/read-all",     markAllActivitiesRead);
router.patch("/activities/:id/read",     markActivityRead);
module.exports = router;