const { Album, AlbumLaunch } = require("../models");
const launchService = require("../services/launchService");

function badRequest(msg, res) {
  return res.status(400).json({ success: false, message: msg });
}

/**
 * GET /api/albums/:albumId/launch
 * Public. Returns the launch state (or null).
 */
exports.getLaunch = async (req, res) => {
  try {
    const launch = await launchService.getLaunchForAlbum(req.params.albumId);
    if (!launch) {
      return res.json({ success: true, launch: null, effectiveStatus: null });
    }
    return res.json({
      success: true,
      launch,
      effectiveStatus: launchService.effectiveStatus(launch),
    });
  } catch (err) {
    console.error("GET LAUNCH ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/albums/:albumId/launch
 * Admin only.
 * Body: { physicalLaunchAt, title?, description?, tierThresholds? }
 */
exports.createLaunch = async (req, res) => {
  try {
    const { albumId } = req.params;
    const { physicalLaunchAt, title, description, tierThresholds } = req.body;

    if (!physicalLaunchAt) return badRequest("physicalLaunchAt is required", res);

    const album = await Album.findByPk(albumId);
    if (!album) return res.status(404).json({ success: false, message: "Album not found" });

    const existing = await AlbumLaunch.findOne({ where: { albumId } });
    if (existing && ["scheduled", "active"].includes(existing.status)) {
      return res.status(409).json({
        success: false,
        message: "This album already has a scheduled or active launch",
      });
    }

    const { startsAt, endsAt } = launchService.computeLaunchWindow(physicalLaunchAt);

    const launch = await AlbumLaunch.create({
      albumId,
      startsAt,
      endsAt,
      physicalLaunchAt: new Date(physicalLaunchAt),
      status: "scheduled",
      createdBy: req.user.id,
      title: title || null,
      description: description || null,
      tierThresholds: tierThresholds || null,
    });

    res.status(201).json({
      success: true,
      launch,
      effectiveStatus: launchService.effectiveStatus(launch),
    });
  } catch (err) {
    console.error("CREATE LAUNCH ERROR:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/albums/:albumId/launch
 * Admin only.
 */
exports.updateLaunch = async (req, res) => {
  try {
    const { albumId } = req.params;
    const launch = await AlbumLaunch.findOne({ where: { albumId } });
    if (!launch) return res.status(404).json({ success: false, message: "Launch not found" });

    const {
      physicalLaunchAt,
      startsAt,
      endsAt,
      status,
      title,
      description,
      tierThresholds,
    } = req.body;

    if (physicalLaunchAt) {
      const w = launchService.computeLaunchWindow(physicalLaunchAt);
      launch.physicalLaunchAt = new Date(physicalLaunchAt);
      launch.startsAt = w.startsAt;
      launch.endsAt = w.endsAt;
    }

    if (startsAt) launch.startsAt = new Date(startsAt);
    if (endsAt)   launch.endsAt   = new Date(endsAt);

    if (status) {
      const allowed = ["scheduled", "active", "ended", "cancelled"];
      if (!allowed.includes(status)) return badRequest("Invalid status", res);
      launch.status = status;
    }

    if (title !== undefined)          launch.title = title;
    if (description !== undefined)    launch.description = description;
    if (tierThresholds !== undefined) launch.tierThresholds = tierThresholds;

    await launch.save();

    res.json({
      success: true,
      launch,
      effectiveStatus: launchService.effectiveStatus(launch),
    });
  } catch (err) {
    console.error("UPDATE LAUNCH ERROR:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/albums/:albumId/launch
 * Admin only. Soft cancel.
 */
exports.cancelLaunch = async (req, res) => {
  try {
    const launch = await AlbumLaunch.findOne({ where: { albumId: req.params.albumId } });
    if (!launch) return res.status(404).json({ success: false, message: "Launch not found" });

    launch.status = "cancelled";
    await launch.save();

    res.json({ success: true, message: "Launch cancelled", launch });
  } catch (err) {
    console.error("CANCEL LAUNCH ERROR:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};