// services/supportService.js
const crypto = require("crypto");
const { Album, AlbumLaunch, User,Payment, Plaque } = require("../models");
const launchService = require("./launchService");
const serialService = require("./serialService");
const CDN = process.env.MEDIA_CDN_BASE;

const PLAQUE_IMAGE_BY_TIER = {
  SILVER:   `${CDN}/plaques/silver.png`,
  GOLD:     `${CDN}/plaques/gold.png`,
  SAPPHIRE: `${CDN}/plaques/sapphire.png`,
  EMERALD:  `${CDN}/plaques/emerald.png`,
  CRIMSON:  `${CDN}/plaques/crimson.png`,
};

function plaqueImageFor(tier, isThankYou = false) {
  if (isThankYou) return `${CDN}/plaques/thankyou.png`;
  return PLAQUE_IMAGE_BY_TIER[tier] || `${CDN}/plaques/thankyou.png`;
}
function pickTier(amount, thresholds) {
  if (!Array.isArray(thresholds) || thresholds.length === 0) return null;
  const sorted = [...thresholds].sort((a, b) => b.minAmount - a.minAmount);
  return sorted.find((t) => Number(amount) >= t.minAmount)?.tier || null;
}

function generateReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `UZI-${date}-${rand}`;
}
async function supportAlbum({
  albumId, userId, amount, currency, paymentMethod,
  customerPhone, customerEmail, user,   // ← pass the requester
}) {
  if (!amount || Number(amount) <= 0) throw new Error("Amount must be greater than zero");
  if (!currency) throw new Error("Currency is required");

  const album = await Album.findByPk(albumId, {
    include: [{ model: AlbumLaunch, as: "launch" }],
  });
  if (!album) throw new Error("Album not found");

  // Demo bypass check
  const isDemo = Boolean(user?.isDemoAccount);
  if (isDemo && !album.isDemo) {
    throw new Error("Demo accounts can only interact with demo albums");
  }

  const launch = album.launch;
  const status = launchService.effectiveStatus(launch);
  const launchIsActive = status === "active";

  // Demo accounts get instant success
  const paymentStatus = isDemo ? "SUCCESS" : "PENDING";
  const paymentPaid   = isDemo;

  const payment = await Payment.create({
    referenceNumber: generateReference(),
    userId,
    albumId,
    amount,
    currency,
    paymentMethod: paymentMethod || (isDemo ? "DEMO" : null),
    customerPhone: customerPhone || null,
    customerEmail: customerEmail || null,
    status: paymentStatus,
    paid: paymentPaid,
    isDemo,
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
        plaqueImage: plaqueImageFor(tier, !tier),
        amount,
        ownerType: "FAN",
        ownerId: userId,
        albumId,
        artistId: album.artistId,
        paymentId: payment.id,
        status: isDemo ? "PAID" : "PENDING_PAYMENT",
        issuedAt: isDemo ? new Date() : null,
        isVerified: true,
        verifiedAt: isDemo ? new Date() : null,
        isDemo,
      });
    }
  }

  return { payment, plaque, launchIsActive, launchStatus: status, isDemo };
}

module.exports = { supportAlbum, pickTier };