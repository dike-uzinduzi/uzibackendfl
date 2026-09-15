const {
  ArtistFollow,
  FanActivity,
  Artist,
  Album,
  Payment,
  Plaque,
} = require("../models");

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW ARTIST
// POST /api/engagement/artists/:artistId/follow
// ─────────────────────────────────────────────────────────────────────────────
const followArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user.id;

    const artist = await Artist.findByPk(artistId);
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    const [follow, created] = await ArtistFollow.findOrCreate({
      where: { userId, artistId },
      defaults: { userId, artistId },
    });

    if (created) {
      await FanActivity.create({
        userId,
        artistId,
        type: "ARTIST_FOLLOWED",
        title: "Artist followed",
        message: `You are now following ${artist.name}`,
        metadata: { artistId: artist.id, artistName: artist.name },
      });
    }

    return res.json({
      success: true,
      message: created ? "Artist followed successfully" : "Artist already followed",
      following: true,
      data: follow,
    });
  } catch (err) {
    console.error("followArtist error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error following artist",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNFOLLOW ARTIST
// DELETE /api/engagement/artists/:artistId/follow
// ─────────────────────────────────────────────────────────────────────────────
const unfollowArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user.id;

    const artist = await Artist.findByPk(artistId);
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    const deleted = await ArtistFollow.destroy({ where: { userId, artistId } });

    return res.json({
      success: true,
      message: deleted ? "Artist unfollowed successfully" : "Artist was not followed",
      following: false,
    });
  } catch (err) {
    console.error("unfollowArtist error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error unfollowing artist",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FAN ACTIVITY FEED
// GET /api/engagement/feed?limit=20&offset=0
// ─────────────────────────────────────────────────────────────────────────────
const getFanFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
    const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);

    const feed = await FanActivity.findAll({
      where: { userId },
      include: [
        {
          model: Artist,
          attributes: ["id", "name", "stageName"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.json({ success: true, count: feed.length, data: feed });
  } catch (err) {
    console.error("getFanFeed error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error fetching feed",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FAN STATS / SUMMARY
// GET /api/engagement/stats
// ─────────────────────────────────────────────────────────────────────────────
const getFanStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [successfulPayments, totalPlaques, artistsFollowed] = await Promise.all([
      Payment.findAll({
        where: { userId, status: "SUCCESS", paid: true },
        attributes: ["id", "amount", "albumId"],
        include: [
          {
            model: Album,
            attributes: ["id", "artistId", "title"],
            required: false,
            include: [
              {
                model: Artist,
                as: "artist",              // ← uses the new alias
                attributes: ["id", "name", "stageName"],
                required: false,
              },
            ],
          },
        ],
      }),
      Plaque.count({ where: { ownerId: userId } }),   // ← ownerId, not userId
      ArtistFollow.count({ where: { userId } }),
    ]);

    const totalSpent = successfulPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const artistIds = new Set(
      successfulPayments.map((p) => p.Album?.artistId).filter(Boolean)
    );

    const albumIds = new Set(
      successfulPayments.map((p) => p.albumId || p.Album?.id).filter(Boolean)
    );

    const artistsSupported = artistIds.size;
    const supportedAlbums = albumIds.size;

    const mostSupportedArtistMap = new Map();

    for (const payment of successfulPayments) {
      const artistId = payment.Album?.artistId;
      const artist = payment.Album?.artist;             // ← lowercase alias
      const artistName = artist?.stageName || artist?.name;

      if (!artistId) continue;

      const current = mostSupportedArtistMap.get(artistId) || {
        artistId,
        artistName: artistName || "Unknown Artist",
        supportCount: 0,
        totalAmount: 0,
      };

      current.supportCount += 1;
      current.totalAmount += Number(payment.amount || 0);

      mostSupportedArtistMap.set(artistId, current);
    }

    const topSupportedArtists = Array.from(mostSupportedArtistMap.values())
      .sort((a, b) => {
        if (b.supportCount !== a.supportCount) return b.supportCount - a.supportCount;
        return b.totalAmount - a.totalAmount;
      })
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        totalSpent,
        totalPlaques,
        artistsFollowed,
        artistsSupported,
        supportedAlbums,
        topSupportedArtists,
      },
    });
  } catch (err) {
    console.error("getFanStats error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error fetching fan stats",
    });
  }
};

module.exports = {
  followArtist,
  unfollowArtist,
  getFanFeed,
  getFanStats,
};