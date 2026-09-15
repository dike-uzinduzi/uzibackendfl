const { supportAlbum } = require("../services/supportService");
const { Album, AlbumLaunch } = require("../models");

/**
 * POST /api/albums/:albumId/support
 * Auth required. Places a support amount.
 */
exports.support = async (req, res) => {
  try {
    const { albumId } = req.params;
    const { amount, currency, paymentMethod, customerPhone, customerEmail } = req.body;

    const result = await supportAlbum({
      albumId,
      userId: req.user.id,
      amount,
      currency,
      paymentMethod,
      customerPhone,
      customerEmail,
      user:req.user,
    });

    res.status(201).json({
      success: true,
      launchIsActive: result.launchIsActive,
      launchStatus: result.launchStatus,
      payment: result.payment,
      plaque: result.plaque,
      message: result.plaque
        ? `Support placed. You have earned a ${result.plaque.plaqueType} plaque.`
        : result.launchIsActive
          ? "Support placed. Amount is below the minimum plaque threshold."
          : "Support placed. The virtual launch is closed, so no plaque was earned.",
    });
  } catch (err) {
    console.error("SUPPORT ERROR:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};