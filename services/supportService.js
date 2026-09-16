
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

// services/supportService.js

const STATIC_TIER_IMAGES = {
  WOOD:     "plaques/wood.png",
  CRIMSON:  "plaques/crimson.png",
  SAPPHIRE: "plaques/sapphire.png",
  EMERALD:  "plaques/emerald.png",
  SILVER:   "plaques/silver.png",
  GOLD:     "plaques/gold.png",
};

/**
 * Resolve a tier slug to a full public image URL.
 * Prefers the PlaqueTier table (admin editable), falls back to a static map,
 * then to the thank-you placeholder.
 */
async function plaqueImageFor(tierSlug) {
  const CDN = process.env.MEDIA_CDN_BASE;

  try {
    const { PlaqueTier } = require("../models");
    const row = await PlaqueTier.findOne({
      where: { slug: String(tierSlug).toUpperCase() },
      attributes: ["imageUrl"],
    });

    if (row?.imageUrl) {
      if (row.imageUrl.startsWith("http")) return row.imageUrl;
      return `${CDN}/${row.imageUrl}`;
    }
  } catch (err) {
    console.warn("plaqueImageFor: DB lookup failed:", err.message);
  }

  const key = String(tierSlug).toUpperCase();
  if (STATIC_TIER_IMAGES[key]) {
    return `${CDN}/${STATIC_TIER_IMAGES[key]}`;
  }

  return `${CDN}/plaques/thankyou.png`;
}

async function pickTier(amount) {
  const { PlaqueTier } = require("../models");
  const tiers = await PlaqueTier.findAll({
    where: { isActive: true },
    order: [["minAmount", "DESC"]],
  });
  for (const t of tiers) {
    if (Number(amount) >= Number(t.minAmount)) return t.slug;
  }
  return null;
}

function generateReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = require("crypto").randomBytes(4).toString("hex").toUpperCase();
  return `UZI-${date}-${rand}`;
}


async function supportAlbum({
  albumId,
  userId,
  amount,
  currency,
  paymentMethod,
  paymentMethodCode,
  customerPhone,
  customerEmail,
  shippingAddress,
  user,
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
    const tier = await pickTier(amount);

    if (tier) {
      // Physical tier reached — create a plaque row
      const serialNumber = await serialService.generateSerialNumber(tier);
      const verificationCode = serialService.generateVerificationCode();
      const imageUrl = await plaqueImageFor(tier);

      plaque = await Plaque.create({
        serialNumber,
        verificationCode,
        plaqueType: tier,
        plaqueImageUrl: imageUrl,
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
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : "",
      });
    }
    // else: below the lowest tier — thank-you only, no plaque row
  }

  return { payment, plaque, launchIsActive, launchStatus: status, isDemo };
}
// services/supportService.js — add this below supportAlbum

/**
 * For real (non-demo) fans paying through Pesepay.
 * Creates a PENDING Payment and PENDING_PAYMENT Plaque.
 * The actual charge happens through Pesepay; fulfillment happens
 * in pesepayService._fulfill when the payment confirms.
 */
async function createPesepaySupport({
  albumId,
  userId,
  amount,
  currency,
  paymentMethod,      // "ECOCASH" | "PESEPAY"
  paymentMethodCode,  // e.g. "PZW211" for EcoCash
  customerPhone,
  customerEmail,
  shippingAddress,
}) {
  if (!amount || Number(amount) <= 0) throw new Error("Amount must be greater than zero");
  if (!currency) throw new Error("Currency is required");

  const album = await Album.findByPk(albumId, {
    include: [{ model: AlbumLaunch, as: "launch" }],
  });
  if (!album) throw new Error("Album not found");

  const launch = album.launch;
  const status = launchService.effectiveStatus(launch);
  const launchIsActive = status === "active";

  // Compute tier and pre-create the Plaque in PENDING_PAYMENT
  let plaque = null;
  let tier = null;

  if (launchIsActive) {
    tier = await pickTier(amount);
  }

  // Build the album/artist names for the Pesepay reason
  const { Artist } = require("../models");
  const artist = await Artist.findByPk(album.artistId, { attributes: ["name", "stageName"] });
  const artistName = artist?.stageName || artist?.name || "the artist";

  // Initiate the payment with Pesepay
  const pesepayService = require("./pesepayService");

  let paymentResponse;

  if (paymentMethod === "ECOCASH") {
    // Seamless — pushes to the fan's phone
    paymentResponse = await pesepayService.initiateSeamlessPayment({
      amount,
      userId,
      email: customerEmail,
      phone: customerPhone,
      albumId,
      plaqueType: tier,
      paymentMethodCode: paymentMethodCode || "PZW211",
      requiredFields: {
        customerPhoneNumber: customerPhone,
      },
      currencyCode: currency,
      albumTitle: album.title,
      artistName,
    });
  } else {
    // Pesepay redirect — hosted page with all methods
    paymentResponse = await pesepayService.initiatePlaquePurchase({
      amount,
      userId,
      email: customerEmail,
      phone: customerPhone,
      albumId,
      plaqueType: tier,
      currencyCode: currency,
      albumTitle: album.title,
      artistName,
    });
  }

  // The payment record is already created inside pesepayService.
  // Find it to pre-create the plaque linked to it.
  const { Payment } = require("../models");
  const payment = await Payment.findOne({
    where: { referenceNumber: paymentResponse.referenceNumber },
  });

  if (payment && tier && launchIsActive) {
    const serialService = require("./serialService");
    const serialNumber = await serialService.generateSerialNumber(tier);
    const verificationCode = serialService.generateVerificationCode();
    const imageUrl = await plaqueImageFor(tier);

    plaque = await Plaque.create({
      serialNumber,
      verificationCode,
      plaqueType: tier,
      plaqueImageUrl: imageUrl,
      amount,
      ownerType: "FAN",
      ownerId: userId,
      albumId,
      artistId: album.artistId,
      paymentId: payment.id,
      status: "PENDING_PAYMENT",
      isVerified: true,
      shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : "",
    });
  }

  return {
    success: true,
    provider: paymentMethod,
    referenceNumber: paymentResponse.referenceNumber,
    redirectUrl: paymentResponse.redirectUrl || null,
    pollUrl: paymentResponse.pollUrl || null,
    plaque,
    launchIsActive,
    launchStatus: status,
  };
}

module.exports = { supportAlbum, pickTier, plaqueImageFor, createPesepaySupport };

