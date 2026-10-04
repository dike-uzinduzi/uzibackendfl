const { Op, fn, col } = require("sequelize");
const {
  sequelize,
  User, Artist, Album, AlbumLaunch, Track, Payment, Plaque, Genre,
} = require("../models");

// ─── Overview stats ─────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalUsers, totalArtists, newUsersThisWeek,
      totalAlbums, publishedAlbums,
      activeLaunches, scheduledLaunches,
      totalPlaques, readyForDelivery,
      revenueTotal, revenueThisMonth, pendingPayouts,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: "artist" } }),
      User.count({ where: { createdAt: { [Op.gte]: weekAgo } } }),
      Album.count({ where: { is_deleted: false } }),
      Album.count({ where: { is_deleted: false, is_published: true } }),
      AlbumLaunch.count({ where: { status: "active" } }),
      AlbumLaunch.count({ where: { status: "scheduled" } }),
      Plaque.count(),
      Plaque.count({ where: { status: "READY_FOR_DELIVERY" } }).catch(() => 0),
      Payment.sum("amountCents", { where: { status: "completed" } }).catch(() => 0),
      Payment.sum("amountCents", {
        where: { status: "completed", createdAt: { [Op.gte]: monthStart } },
      }).catch(() => 0),
      Payment.sum("amountCents", { where: { status: "pending" } }).catch(() => 0),
    ]);

    return res.json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          artists: totalArtists || 0,
          newThisWeek: newUsersThisWeek || 0,
        },
        albums: {
          total: totalAlbums || 0,
          published: publishedAlbums || 0,
        },
        launches: {
          active: activeLaunches || 0,
          scheduled: scheduledLaunches || 0,
        },
        plaques: {
          total: totalPlaques || 0,
          readyForDelivery: readyForDelivery || 0,
        },
        revenue: {
          totalCents: revenueTotal || 0,
          thisMonthCents: revenueThisMonth || 0,
          pendingPayoutsCents: pendingPayouts || 0,
        },
      },
    });
  } catch (err) {
    console.error("admin.stats error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not load stats",
    });
  }
};

// ─── Users list ────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  try {
    const {
      search = "",
      role = "",
      verified,
      suspended,
      page = "1",
      limit = "25",
    } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { userName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (verified === "true") where.isEmailVerified = true;
    if (verified === "false") where.isEmailVerified = false;
    if (suspended === "true") where.isSuspended = true;
    if (suspended === "false") where.isSuspended = false;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    return res.json({
      success: true,
      data: {
        items: rows.map((u) => u.get({ plain: true })),
        total: count,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("admin.listUsers error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not load users",
    });
  }
};

// ─── Albums list ───────────────────────────────────────────
exports.listAlbums = async (req, res) => {
  try {
    const {
      search = "",
      published,
      featured,
      deleted = "false",
      demo,                     // ← accepts 'true' | 'false' | undefined
      albumType,
      page = "1",
      limit = "25",
    } = req.query;

    const where = {};
    if (search) where.title = { [Op.iLike]: `%${search}%` };
    if (published === "true") where.is_published = true;
    if (published === "false") where.is_published = false;
    if (featured === "true") where.is_featured = true;
    if (featured === "false") where.is_featured = false;
    if (deleted === "true") where.is_deleted = true;
    else if (deleted === "false") where.is_deleted = false;
    if (demo === "true") where.isDemo = true;      // ← new
    if (demo === "false") where.isDemo = false;    // ← new
    if (albumType) where.albumType = albumType;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const { rows, count } = await Album.findAndCountAll({
      where,
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "stageName", "name"],
        },
        {
          model: Genre,
          as: "Genres",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    return res.json({
      success: true,
      data: {
        items: rows.map((a) => a.get({ plain: true })),
        total: count,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("admin.listAlbums error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not load albums",
    });
  }
};

// ─── Album detail (single) ─────────────────────────────────
exports.getAlbum = async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id, {
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "stageName", "name"],
        },
        { model: AlbumLaunch, as: "launch" },
        {
          model: Genre,
          as: "Genres",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    return res.json({ success: true, data: album.get({ plain: true }) });
  } catch (err) {
    console.error("admin.getAlbum error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not load album",
    });
  }
};

// ─── Update album metadata ─────────────────────────────────
exports.updateAlbum = async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const allowed = [
      "title",
      "description",
      "albumType",
      "release_date",
      "copyright_info",
      "publisher",
      "credits",
      "affiliation",
      "isDemo",
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        album[key] = req.body[key];
      }
    }

    await album.save();

    // Genres via the many-to-many association
    if (Array.isArray(req.body.genres)) {
      const genreIds = await resolveGenreIds(req.body.genres);
      await album.setGenres(genreIds);
    }

    // Re-fetch with includes so the response has fresh related data
    const fresh = await Album.findByPk(req.params.id, {
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "stageName", "name"],
        },
        {
          model: Genre,
          as: "Genres",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    return res.json({
      success: true,
      message: "Album updated",
      data: fresh.get({ plain: true }),
    });
  } catch (err) {
    console.error("admin.updateAlbum error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not update album",
    });
  }
};

// ─── Helper: resolve mixed names/ids/objects into genre ids ─
async function resolveGenreIds(items) {
  const ids = [];
  for (const item of items) {
    if (item == null) continue;

    // Object shapes (e.g. round-tripped from a formatted response)
    if (typeof item === "object") {
      if (typeof item.id === "string" && item.id) {
        ids.push(item.id);
        continue;
      }
      if (typeof item.name === "string" && item.name.trim()) {
        const [g] = await Genre.findOrCreate({
          where: { name: item.name.trim() },
        });
        ids.push(g.id);
        continue;
      }
      continue;   // unrecognized shape — skip
    }

    const s = String(item).trim();
    if (!s) continue;

    // Looks like a UUID → treat as id
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
    ) {
      ids.push(s);
      continue;
    }

    // Treat as a name → find or create
    const [genre] = await Genre.findOrCreate({ where: { name: s } });
    ids.push(genre.id);
  }
  return ids;
}

// ─── Publish / unpublish ───────────────────────────────────
exports.publishAlbum = async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const value = req.body.value === true || req.body.value === "true";
    album.is_published = value;
    await album.save();

    return res.json({
      success: true,
      message: value ? "Album published" : "Album unpublished",
      data: { id: album.id, is_published: album.is_published },
    });
  } catch (err) {
    console.error("admin.publishAlbum error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not update album",
    });
  }
};

// ─── Feature / unfeature ───────────────────────────────────
exports.featureAlbum = async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const value = req.body.value === true || req.body.value === "true";

    if (value) {
      // Only one featured album at a time — unset others
      await Album.update(
        { is_featured: false },
        { where: { is_featured: true, id: { [Op.ne]: album.id } } },
      );
    }

    album.is_featured = value;
    await album.save();

    return res.json({
      success: true,
      message: value ? "Album featured" : "Album unfeatured",
      data: { id: album.id, is_featured: album.is_featured },
    });
  } catch (err) {
    console.error("admin.featureAlbum error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not update album",
    });
  }
};

// ─── Soft delete / restore ─────────────────────────────────
exports.softDeleteAlbum = async (req, res) => {
  try {
    const album = await Album.findByPk(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const value = req.body.value !== false && req.body.value !== "false";
    album.is_deleted = value;

    // Unpublish and unfeature when deleted
    if (value) {
      album.is_published = false;
      album.is_featured = false;
    }

    await album.save();

    return res.json({
      success: true,
      message: value ? "Album deleted" : "Album restored",
      data: { id: album.id, is_deleted: album.is_deleted },
    });
  } catch (err) {
    console.error("admin.softDeleteAlbum error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not update album",
    });
  }
};

// ─── Safe delete: preflight ────────────────────────────────
exports.albumDeletePreflight = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findByPk(id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const blockers = [];

    if (!album.is_deleted) {
      blockers.push({
        type: "not_soft_deleted",
        message: "Soft-delete the album first",
      });
    }

    const trackCount = await Track.count({ where: { albumId: id } });
    if (trackCount > 0) {
      blockers.push({ type: "tracks", count: trackCount });
    }

    const launch = await AlbumLaunch.findOne({ where: { albumId: id } });
    if (launch) {
      blockers.push({ type: "launch", status: launch.status });
    }

    const payments = await Payment.count({ where: { albumId: id } });
    if (payments > 0) {
      blockers.push({ type: "payments", count: payments });
    }

    return res.json({
      success: true,
      data: {
        canHardDelete: blockers.length === 0,
        blockers,
      },
    });
  } catch (err) {
    console.error("admin.albumDeletePreflight error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Could not check album",
    });
  }
};

// ─── Safe delete: hard delete ──────────────────────────────
exports.hardDeleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findByPk(id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    if (!album.is_deleted) {
      return res.status(409).json({
        success: false,
        message: "Album must be soft-deleted before permanent deletion",
        code: "NOT_SOFT_DELETED",
      });
    }

    const trackCount = await Track.count({ where: { albumId: id } });
    if (trackCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Album has ${trackCount} track(s). Remove them first.`,
        code: "HAS_TRACKS",
      });
    }

    const launch = await AlbumLaunch.findOne({ where: { albumId: id } });
    if (launch) {
      return res.status(409).json({
        success: false,
        message: `Album has a ${launch.status} launch. Cancel it first.`,
        code: "HAS_LAUNCH",
      });
    }

    const payments = await Payment.count({ where: { albumId: id } });
    if (payments > 0) {
      return res.status(409).json({
        success: false,
        message: `Album has ${payments} payment record(s). Cannot hard-delete.`,
        code: "HAS_PAYMENTS",
      });
    }

    await album.destroy({ force: true });

    return res.json({
      success: true,
      message: "Album permanently deleted",
    });
  } catch (err) {
    console.error("admin.hardDeleteAlbum error:", err);

    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Album still has related records. Remove them first.",
        code: "FK_BLOCKED",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Could not delete album",
    });
  }
};