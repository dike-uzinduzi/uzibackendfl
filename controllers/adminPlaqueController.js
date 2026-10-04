const { Op } = require("sequelize");
const { Plaque, User, Album, Artist, Payment } = require("../models");

// Mirror of the model's enum, in transition order
const STATUS_FLOW = {
  PENDING_PAYMENT:    ["PAID", "CANCELLED"],
  PAID:               ["ISSUED", "CANCELLED"],
  ISSUED:             ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION:      ["READY_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED:          ["COLLECTED"],
  COLLECTED:          [],
  CANCELLED:          [],
};

function canTransition(from, to) {
  return (STATUS_FLOW[from] || []).includes(to);
}

// ─── List ─────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const {
      status = "",
      search = "",
      demo,
      page = "1",
      limit = "25",
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (demo === "true")  where.isDemo = true;
    if (demo === "false") where.isDemo = false;

    if (search) {
      where[Op.or] = [
        { serialNumber:   { [Op.iLike]: `%${search}%` } },
        { ownerName:      { [Op.iLike]: `%${search}%` } },
        { trackingNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const { rows, count } = await Plaque.findAndCountAll({
      where,
      include: [
        {
          model: Album,
          as: "plaqueAlbum",              // ← real alias
          attributes: ["id", "title"],
        },
        {
          model: Artist,                  // ← no alias — key will be "Artist"
          attributes: ["id", "stageName", "name"],
        },
        {
          model: User,
          as: "owner",                    // ← real alias
          attributes: ["id", "userName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    res.json({
      success: true,
      data: {
        items: rows.map((p) => p.get({ plain: true })),
        total: count,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("adminPlaques.list error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Detail ───────────────────────────────────────────────────
exports.get = async (req, res) => {
  try {
    const plaque = await Plaque.findByPk(req.params.id, {
      include: [
        {
          model: Album,
          as: "plaqueAlbum",
          attributes: ["id", "title", "cover_art"],
        },
        {
          model: Artist,
          attributes: ["id", "stageName", "name"],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "userName", "email"],
        },
        {
          model: Payment,
          as: "plaquePayment",            // ← real alias
          attributes: ["id", "status", "amountCents", "createdAt"],
        },
      ],
    });
    if (!plaque) {
      return res.status(404).json({ success: false, message: "Plaque not found" });
    }
    res.json({ success: true, data: plaque.get({ plain: true }) });
  } catch (err) {
    console.error("adminPlaques.get error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Status transition ────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status, trackingNumber, cancellationReason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const plaque = await Plaque.findByPk(req.params.id);
    if (!plaque) {
      return res.status(404).json({ success: false, message: "Plaque not found" });
    }

    const next = String(status).toUpperCase();

    if (!canTransition(plaque.status, next)) {
      return res.status(409).json({
        success: false,
        message: `Cannot transition from ${plaque.status} to ${next}`,
        code: "INVALID_TRANSITION",
      });
    }

    plaque.status = next;
    const now = new Date();

    if (next === "ISSUED")    plaque.issuedAt    = now;
    if (next === "DELIVERED") plaque.deliveredAt = now;
    if (next === "COLLECTED") plaque.collectedAt = now;
    if (next === "CANCELLED") {
      plaque.cancelledAt = now;
      if (cancellationReason) plaque.cancellationReason = cancellationReason;
    }

    if (trackingNumber !== undefined) plaque.trackingNumber = trackingNumber;

    await plaque.save();

    res.json({ success: true, data: plaque.get({ plain: true }) });
  } catch (err) {
    console.error("adminPlaques.updateStatus error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Notes ────────────────────────────────────────────────────
exports.updateNotes = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const plaque = await Plaque.findByPk(req.params.id);
    if (!plaque) {
      return res.status(404).json({ success: false, message: "Plaque not found" });
    }
    plaque.adminNotes = adminNotes ?? "";
    await plaque.save();
    res.json({ success: true, data: plaque.get({ plain: true }) });
  } catch (err) {
    console.error("adminPlaques.updateNotes error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Shipping ─────────────────────────────────────────────────
exports.updateShipping = async (req, res) => {
  try {
    const { shippingAddress, trackingNumber } = req.body;
    const plaque = await Plaque.findByPk(req.params.id);
    if (!plaque) {
      return res.status(404).json({ success: false, message: "Plaque not found" });
    }
    if (shippingAddress !== undefined) plaque.shippingAddress = shippingAddress;
    if (trackingNumber !== undefined) plaque.trackingNumber = trackingNumber;
    await plaque.save();
    res.json({ success: true, data: plaque.get({ plain: true }) });
  } catch (err) {
    console.error("adminPlaques.updateShipping error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};