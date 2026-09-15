const { Plaque, User, Profile, Album, Artist, Payment } = require("../models");

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
  return PLAQUE_IMAGE_BY_TIER[String(tier || "").toUpperCase()] || `${CDN}/plaques/thankyou.png`;
}

/**
 * Turn a Plaque instance into a plain response object
 * with the derived plaqueImageUrl and the client-facing fields.
 */
function serializePlaque(plaque) {
  if (!plaque) return null;
  const p = plaque.get ? plaque.get({ plain: true }) : plaque;

  return {
    id: p.id,
    serialNumber: p.serialNumber,
    plaqueType: p.plaqueType,
    plaqueImageUrl: p.plaqueImageUrl || plaqueImageFor(p.plaqueType, p.thankYouNoteOnly),
    status: p.status,
    amount: p.amount,
    ownerType: p.ownerType,
    ownerName: p.ownerName,
    thankYouNoteOnly: p.thankYouNoteOnly,
    isDemo: p.isDemo,
    isVerified: p.isVerified,
    shippingAddress: p.shippingAddress,
    trackingNumber: p.trackingNumber,
    issuedAt: p.issuedAt,
    deliveredAt: p.deliveredAt,
    collectedAt: p.collectedAt,
    cancelledAt: p.cancelledAt,
    createdAt: p.createdAt,
    album: p.plaqueAlbum
      ? {
          id: p.plaqueAlbum.id,
          title: p.plaqueAlbum.title,
          coverImage: p.plaqueAlbum.cover_art,
        }
      : null,
    artist: p.plaqueAlbum?.artist
      ? {
          id: p.plaqueAlbum.artist.id,
          name: p.plaqueAlbum.artist.stageName || p.plaqueAlbum.artist.name,
        }
      : null,
    payment: p.plaquePayment
      ? {
          referenceNumber: p.plaquePayment.referenceNumber,
          status: p.plaquePayment.status,
          amount: p.plaquePayment.amount,
          currency: p.plaquePayment.currency,
        }
      : null,
    owner: p.owner
      ? {
          id: p.owner.id,
          userName: p.owner.userName,
          email: p.owner.email,
          role: p.owner.role,
        }
      : undefined,
  };
}

class PlaqueService {

  async findAllPlaques() {
    const plaques = await Plaque.findAll({
      include: [
        { model: User, as: "owner", attributes: ["id", "userName", "email", "role"] },
        {
          model: Album,
          as: "plaqueAlbum",
          attributes: ["id", "title", "cover_art"],
          include: [{ model: Artist, as: "artist", attributes: ["id", "name", "stageName"] }],
        },
        {
          model: Payment,
          as: "plaquePayment",
          attributes: ["id", "referenceNumber", "status", "amount", "currency"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return plaques.map(serializePlaque);
  }

  async findPlaquesByUser(userId) {
    const plaques = await Plaque.findAll({
      where: { ownerId: userId },
      include: [
        {
          model: Album,
          as: "plaqueAlbum",
          attributes: ["id", "title", "cover_art"],
          include: [{ model: Artist, as: "artist", attributes: ["id", "name", "stageName"] }],
        },
        {
          model: Payment,
          as: "plaquePayment",
          attributes: ["id", "referenceNumber", "status", "amount", "currency"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return plaques.map(serializePlaque);
  }

  async findPlaqueById(id) {
    const plaque = await Plaque.findByPk(id, {
      include: [
        { model: User, as: "owner", attributes: ["id", "userName", "email", "role"] },
        {
          model: Album,
          as: "plaqueAlbum",
          attributes: ["id", "title", "cover_art"],
          include: [{ model: Artist, as: "artist", attributes: ["id", "name", "stageName"] }],
        },
        {
          model: Payment,
          as: "plaquePayment",
          attributes: ["id", "referenceNumber", "status", "amount", "currency"],
        },
      ],
    });

    if (!plaque) throw new Error("Plaque not found");
    return serializePlaque(plaque);
  }

  async createPlaque(plaqueData, userId) {
    const { generateSerialNumber, generateVerificationCode } = require("./serialService");

    const serialNumber =
      plaqueData.serialNumber || (await generateSerialNumber(plaqueData.plaqueType));

    const verificationCode =
      plaqueData.verificationCode || generateVerificationCode();

    const tier = plaqueData.plaqueType;
    const isThankYou = !tier || plaqueData.thankYouNoteOnly === true;

    const payload = {
      ...plaqueData,
      serialNumber,
      verificationCode,
      plaqueImageUrl:
        plaqueData.plaqueImageUrl || plaqueImageFor(tier, isThankYou),
      ownerId: plaqueData.ownerId || userId,
      ownerType:
        plaqueData.ownerType ||
        (plaqueData.role === "corporate" ? "CORPORATE" : "FAN"),
    };

    const plaque = await Plaque.create(payload);
    return this.findPlaqueById(plaque.id);
  }

  async updatePlaque(id, updateData) {
    const plaque = await Plaque.findByPk(id);
    if (!plaque) throw new Error("Plaque not found");

    // If tier or thankYouNoteOnly changed, refresh the image
    if (updateData.plaqueType || updateData.thankYouNoteOnly !== undefined) {
      const nextTier = updateData.plaqueType || plaque.plaqueType;
      const nextThankYou =
        updateData.thankYouNoteOnly !== undefined
          ? updateData.thankYouNoteOnly
          : plaque.thankYouNoteOnly;

      if (!updateData.plaqueImageUrl) {
        updateData.plaqueImageUrl = plaqueImageFor(nextTier, nextThankYou);
      }
    }

    await plaque.update(updateData);
    return this.findPlaqueById(id);
  }

  async deletePlaque(id) {
    const plaque = await Plaque.findByPk(id);
    if (!plaque) throw new Error("Plaque not found");
    await plaque.destroy();
    return plaque;
  }

  async finalizePlaquePurchase(plaqueId) {
    const t = await Plaque.sequelize.transaction();
    try {
      const plaque = await Plaque.findByPk(plaqueId, {
        include: [
          { model: User, as: "owner", include: [{ model: Profile, as: "profile" }] },
          {
            model: Album,
            as: "plaqueAlbum",
            include: [{ model: Artist, as: "artist" }],
          },
          { model: Payment, as: "plaquePayment" },
        ],
        transaction: t,
      });

      if (!plaque) throw new Error("Plaque not found");

      const album = plaque.plaqueAlbum;
      const artist = album?.artist;
      const payment = plaque.plaquePayment;
      if (!album || !artist || !payment) {
        throw new Error("Missing album, artist, or payment for finalization");
      }

      const { generateDigitalHash } = require("../utils/plaqueIntegrity");

      const profile = plaque.owner?.profile;
      const ownerName =
        plaque.ownerName ||
        [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
        plaque.owner?.userName ||
        "Unknown Owner";

      const { hash } = generateDigitalHash({
        serialNumber: plaque.serialNumber,
        verificationCode: plaque.verificationCode,
        ownerName,
        amount: plaque.amount,
        plaqueType: plaque.plaqueType,
        status: "PAID",
        albumTitle: album.title,
        artistName: artist.stageName || artist.name,
        paymentReference: payment.referenceNumber,
        paymentStatus: payment.status,
        finalizedAt: new Date().toISOString(),
      });

      await plaque.update(
        {
          status: "PAID",
          issuedAt: plaque.issuedAt || new Date(),
          plaqueImageUrl: plaque.plaqueImageUrl || plaqueImageFor(plaque.plaqueType, plaque.thankYouNoteOnly),
          verificationHash: hash,
          isVerified: true,
          verifiedAt: new Date(),
        },
        { transaction: t }
      );

      await t.commit();
      return this.findPlaqueById(plaque.id);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async verifyPlaque(serialNumber, verificationCode = null) {
    const where = { serialNumber };
    if (verificationCode) where.verificationCode = verificationCode;

    const plaque = await Plaque.findOne({
      where,
      include: [
        {
          model: Album,
          as: "plaqueAlbum",
          attributes: ["id", "title", "cover_art"],
          include: [{ model: Artist, as: "artist", attributes: ["id", "name", "stageName"] }],
        },
      ],
    });

    if (!plaque) {
      return { valid: false, message: "Plaque not found or verification code is invalid" };
    }

    // Public verification — no owner info, no payment reference, no verification code
    return {
      valid: true,
      plaque: {
        id: plaque.id,
        serialNumber: plaque.serialNumber,
        plaqueType: plaque.plaqueType,
        plaqueImageUrl: plaque.plaqueImageUrl || plaqueImageFor(plaque.plaqueType, plaque.thankYouNoteOnly),
        status: plaque.status,
        issuedAt: plaque.issuedAt,
        deliveredAt: plaque.deliveredAt,
        isVerified: plaque.isVerified,
        album: plaque.plaqueAlbum
          ? {
              id: plaque.plaqueAlbum.id,
              title: plaque.plaqueAlbum.title,
              cover_art: plaque.plaqueAlbum.cover_art,
            }
          : null,
        artist: plaque.plaqueAlbum?.artist
          ? {
              id: plaque.plaqueAlbum.artist.id,
              name: plaque.plaqueAlbum.artist.stageName || plaque.plaqueAlbum.artist.name,
            }
          : null,
      },
    };
  }
}

module.exports = new PlaqueService();
module.exports.serializePlaque = serializePlaque;
module.exports.plaqueImageFor = plaqueImageFor;