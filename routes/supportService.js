const crypto = require("crypto");
const { Album, AlbumLaunch, Payment, Plaque, Artist } = require("../models");
const launchService = require("./launchService");
const serialService = require("./serialService");

function pickTier(amount, thresholds) {
  if (!Array.isArray(thresholds) || thresholds.length === 0) return null;
  // Sort descending by minAmount, first one where amount >= minAmount wins
  const sorted = [...thresholds].sort((a, b) => b.minAmount - a.minAmount);
  return sorted.find((t) => Number(amount) >= t.minAmount)?.tier || null;
}

function generateReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `UZI-${date}-${rand}`;
}

/**
 * Core support operation:
 *  - Always creates a Payment row.
 *  - Creates a Plaque row only when the launch is currently active
 *    AND the amount qualifies for a tier.
 */
async function supportAlbum({ albumId, userId, amount, currency, paymentMethod, customerPhone, customerEmail }) {
  if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");
  if (!currency) throw new Error("Currency is required");

  const album = await Album.findByPk(albumId, {
    include: [
      { model: AlbumLaunch, as: "launch" },
      { model: Artist,      as: undefined }, // default alias
    ],
  });
  if (!album) throw new Error("Album not found");

  const launch = album.launch;
  const status = launchService.effectiveStatus(launch);
  const launchIsActive = status === "active";

  const payment = await Payment.create({
    referenceNumber: generateReference(),
    userId,
    albumId,
    amount,
    currency,
    paymentMethod: paymentMethod || null,
    customerPhone: customerPhone || null,
    customerEmail: customerEmail || null,
    status: "PENDING",
    paid: false,
  });

  let plaque = null;

  if (launchIsActive) {
    const tier = pickTier(amount, launch.tierThresholds);
    if (tier) {
      const serialNumber = await serialService.generateSerialNumber(tier);
      const verificationCode = serialService.generateVerificationCode();

      plaque = await Plaque.create({
        serialNumber,
        verificationCode,
        plaqueType: tier,
        amount,
        ownerType: "FAN",
        ownerId: userId,
        albumId,
        artistId: album.artistId,
        paymentId: payment.id,
        status: "PENDING_PAYMENT",
      });
    }
  }

  return { payment, plaque, launchIsActive, launchStatus: status };
}

module.exports = { supportAlbum, pickTier };