const { Op, fn, col } = require("sequelize");
const {
  sequelize,
  User, Artist, Album, AlbumLaunch, Payment, Plaque,
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
      totalPlaques, pendingPlaques,
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
      Plaque.count({ where: { status: "pending_shipment" } }).catch(() => 0),
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
          pendingShipment: pendingPlaques || 0,
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

// ─── Users list with search, filter, pagination ────────────
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
