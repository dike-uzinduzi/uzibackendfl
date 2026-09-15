const { Op, fn, col } = require("sequelize");
const Track = require("../models/Track");
const TrackLike = require("../models/TrackLike");
const Album = require("../models/Album");
const AlbumView = require("../models/AlbumView");

/* ==============================
   TRACK LIKE TOGGLE
   ============================== */
exports.toggleTrackLike = async (req, res) => {
  const transaction = await Track.sequelize.transaction();

  try {
    const userId = req.user.id;
    const { trackId } = req.params;

    const track = await Track.findByPk(trackId, { transaction });
    if (!track || track.isDeleted) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Track not found" });
    }

    const existing = await TrackLike.findOne({
      where: { userId, trackId },
      transaction,
    });

    let liked;

    if (existing) {
      await existing.destroy({ transaction });
      await track.decrement("likeCount", { by: 1, transaction });
      liked = false;
    } else {
      await TrackLike.create({ userId, trackId }, { transaction });
      await track.increment("likeCount", { by: 1, transaction });
      liked = true;
    }

    await transaction.commit();
    await track.reload();

    return res.json({
      success: true,
      data: { liked, likeCount: track.likeCount },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("toggleTrackLike error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==============================
   ALBUM VIEW TRACKING
   ============================== */
exports.registerAlbumView = async (req, res) => {
  const transaction = await Album.sequelize.transaction();

  try {
    const { albumId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Authentication required to register a unique view.",
      });
    }

    const album = await Album.findByPk(albumId, { transaction });
    if (!album) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    const existing = await AlbumView.findOne({
      where: { albumId, userId },
      transaction,
    });

    if (existing) {
      await transaction.commit();
      return res.json({
        success: true,
        data: { viewed: false, viewCount: album.viewCount },
      });
    }

    await AlbumView.create({ albumId, userId }, { transaction });
    await album.increment("viewCount", { by: 1, transaction });

    await transaction.commit();
    await album.reload();

    return res.json({
      success: true,
      data: { viewed: true, viewCount: album.viewCount },
    });
  } catch (err) {
    await transaction.rollback();
    console.error("registerAlbumView error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==============================
   ALBUM INTERACTION SUMMARY
   ============================== */
exports.getAlbumInteractionSummary = async (req, res) => {
  try {
    const { albumId } = req.params;
    const userId = req.user?.id || null;

    const album = await Album.findByPk(albumId, {
      include: [
        {
          model: Track,
          as: "tracks",              // or `Track` without alias if you didn't change the model
          where: { isDeleted: false },
          required: false,
        },
      ],
    });

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    const tracks = album.tracks || album.Tracks || [];
    const trackIds = tracks.map((t) => t.id);

    // Unique viewers — distinct userIds
    const uniqueUserViews = await AlbumView.count({
      where: { albumId, userId: { [Op.ne]: null } },
      distinct: true,
      col: "userId",
    });

    if (trackIds.length === 0) {
      return res.json({
        success: true,
        data: {
          album: {
            id: album.id,
            title: album.title,
            viewCount: album.viewCount,
            uniqueUserViews,
          },
          tracks: [],
        },
      });
    }

    const likeCounts = await TrackLike.findAll({
      where: { trackId: { [Op.in]: trackIds } },
      attributes: ["trackId", [fn("COUNT", col("trackId")), "count"]],
      group: ["trackId"],
      raw: true,
    });

    const likeMap = {};
    for (const row of likeCounts) likeMap[row.trackId] = Number(row.count);

    let userLikes = [];
    if (userId) {
      const likedRows = await TrackLike.findAll({
        where: { userId, trackId: { [Op.in]: trackIds } },
        attributes: ["trackId"],
        raw: true,
      });
      userLikes = likedRows.map((r) => r.trackId);
    }

    return res.json({
      success: true,
      data: {
        album: {
          id: album.id,
          title: album.title,
          viewCount: album.viewCount,
          uniqueUserViews,
        },
        tracks: tracks.map((t) => ({
          id: t.id,
          title: t.title,
          likeCount: likeMap[t.id] || 0,
          likedByUser: userLikes.includes(t.id),
        })),
      },
    });
  } catch (err) {
    console.error("getAlbumInteractionSummary error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};