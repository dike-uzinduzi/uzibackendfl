const pesepayService = require("../services/pesepayService");
const { Album, Artist, Payment, User,Plaque } = require("../models");
const emailService = require("../services/emailService");

class PaymentController {
  constructor() {
    this.getAllPayments = this.getAllPayments.bind(this);
    this.getActiveCurrencies = this.getActiveCurrencies.bind(this);
    this.getPaymentMethods = this.getPaymentMethods.bind(this);
    this.initiatePurchase = this.initiatePurchase.bind(this);
    this.initiateSeamlessPurchase = this.initiateSeamlessPurchase.bind(this);
    this.initiateInnbucksPurchase = this.initiateInnbucksPurchase.bind(this);
    this.handlePesepayCallback = this.handlePesepayCallback.bind(this);
    this.checkPaymentStatus = this.checkPaymentStatus.bind(this);
    this.pollPaymentStatus = this.pollPaymentStatus.bind(this);
    this.getUserPurchases = this.getUserPurchases.bind(this);
    this.getMyAwardedPlaques = this.getMyAwardedPlaques.bind(this);
    this.verifyTransaction = this.verifyTransaction.bind(this);
    this.notifyTransactionFailed = this.notifyTransactionFailed.bind(this);
  }
  //helpers

  async _snapshotPlaqueDecision(albumId, amount) {
  const launchService = require("../services/launchService");
  const { pickTier } = require("../services/supportService");
  const state = await launchService.launchStateForAlbum(albumId);
  const launchIsActive = state.status === "active";
  const tier = launchIsActive ? pickTier(amount, state.tierThresholds) : null;

  return {
    qualifiesForPlaque: Boolean(tier),
    qualifiedTier: tier,
  };
}
  async _resolveAlbum(albumId, res) {
  const album = await Album.findByPk(albumId, {
    attributes: ["id", "title", "cover_art"],
    include: [
      {
        model: Artist,
        as: "artist",               // ← ADD THIS
        attributes: ["id", "name", "stageName", "profilePictureUrl"],
      },
    ],
  });

  if (!album || !album.artist) {     // ← lowercase
    res.status(404).json({ success: false, message: "Album or Artist not found" });
    return null;
  }

  return album;
}

  /**
   * Normalise the paymentMethod stored in DB to a routing bucket.
   * EcoCash is DB-only (webhook-driven).
   * Everything else routes to Pesepay.
   */
  _providerOf(payment) {
    const method = (payment.paymentMethod || "").toUpperCase();
    return method === "ECOCASH" ? "ECOCASH" : "PESEPAY";
  }

  /** Normalise Zimbabwean phone numbers to 263XXXXXXXXX format */
  _normalizeZwMsisdn(msisdn) {
    const raw = String(msisdn || "").replace(/\D/g, "");

    if (raw.startsWith("263") && raw.length === 12) return raw;
    if (raw.startsWith("0") && raw.length === 10) return "263" + raw.slice(1);
    if (raw.startsWith("7") && raw.length === 9) return "263" + raw;

    throw new Error(
      "Customer MSISDN must be in the format 263xxxxxxxxx (e.g. 2637XXXXXXXX)"
    );
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ADMIN
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /**
   * GET /api/payments
   * Admin: list every payment, newest first.
   */
  async getAllPayments(req, res) {
    try {
      const payments = await Payment.findAll({
        order: [["createdAt", "DESC"]],
        include: [
          { model: User, attributes: ["userName", "email"], required: false },
          { model: Album, attributes: ["id", "title"], required: false },
        ],
      });

      res.json({ success: true, count: payments.length, payments });
    } catch (error) {
      console.error("getAllPayments error:", error);
      res.status(500).json({ success: false, message: "Error fetching payments" });
    }
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PESEPAY â€” METADATA
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /**
   * GET /api/payments/currencies
   * Returns active currencies from Pesepay.
   */
  async getActiveCurrencies(req, res) {
    try {
      res.json(await pesepayService.getActiveCurrencies());
    } catch (error) {
      console.error("getActiveCurrencies error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPaymentMethods(req, res) {
    try {
      const { currencyCode = "USD" } = req.query;
      res.json(await pesepayService.getPaymentMethodsByCurrency(currencyCode));
    } catch (error) {
      console.error("getPaymentMethods error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async initiatePurchase(req, res) {
    try {
      const { albumId, plaqueType, amount, phone, currencyCode } = req.body;

      if (!albumId || !plaqueType || !amount || !currencyCode) {
        return res.status(400).json({
          success: false,
          message: "albumId, plaqueType, amount and currencyCode are required",
        });
      }

      const album = await this._resolveAlbum(albumId, res);
      if (!album) return;
const snapshot = await this._snapshotPlaqueDecision(albumId, amount); 
      const result = await pesepayService.initiatePlaquePurchase({
        userId: req.user.id,
        albumId,
        plaqueType,
        amount,
        email: req.user.email,
        phone,
        currencyCode,
        albumTitle: album.title,
        artistName: album.artist.stageName || album.artist.name,
        ...snapshot,
      });

      res.json(result);
    } catch (error) {
      console.error("initiatePurchase error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/payments/purchase-seamless
   * Pesepay seamless flow.
   */
  async initiateSeamlessPurchase(req, res) {
    try {
      const {
        albumId,
        plaqueType,
        amount,
        phone,
        paymentMethodCode,
        currencyCode,
      } = req.body;
      const requiredFields = req.body.requiredFields || {};

      if (!albumId || !plaqueType || !amount || !paymentMethodCode || !currencyCode) {
        return res.status(400).json({
          success: false,
          message:
            "albumId, plaqueType, amount, paymentMethodCode and currencyCode are required",
        });
      }

      const album = await this._resolveAlbum(albumId, res);
      if (!album) return;

const snapshot = await this._snapshotPlaqueDecision(albumId, amount);
      const result = await pesepayService.initiateSeamlessPayment({
        userId: req.user.id,
        albumId,
        plaqueType,
        amount,
        email: req.user.email,
        phone,
        paymentMethodCode,
        requiredFields,
        currencyCode,
        albumTitle: album.title,
        artistName: album.artist.stageName || album.artist.name,
        ...snapshot,
      });

      res.json(result);
    } catch (error) {
      console.error("initiateSeamlessPurchase error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/payments/innbucks
   * InnBucks via Pesepay redirect flow.
   */
  async initiateInnbucksPurchase(req, res) {
    try {
      const { albumId, plaqueType, amount, phone, currencyCode } = req.body;

      if (!phone || String(phone).trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Phone number is required for InnBucks.",
        });
      }

      if (!albumId || !plaqueType || !amount || !currencyCode) {
        return res.status(400).json({
          success: false,
          message: "albumId, plaqueType, amount and currencyCode are required",
        });
      }

      const album = await this._resolveAlbum(albumId, res);
      if (!album) return;
const snapshot = await this._snapshotPlaqueDecision(albumId, amount); 
      const result = await pesepayService.initiateInnbucksPurchase({
        userId: req.user.id,
        albumId,
        plaqueType,
        amount,
        phone,
        email: req.user.email,
        currencyCode,
        albumTitle: album.title,
        artistName: album.artist.stageName || album.artist.name,
        ...snapshot,
      });

      res.json(result);
    } catch (err) {
      console.error("initiateInnbucksPurchase error:", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  }
  async handlePesepayCallback(req, res) {
    const { referenceNumber } = req.body;

    if (!referenceNumber) {
      return res.status(200).json({ success: true, message: "Ignored (no reference)" });
    }

    try {
      await pesepayService.checkAndFulfillPayment(referenceNumber);
      console.log(`Pesepay callback processed: ${referenceNumber}`);
      res.status(200).json({ success: true, message: "Callback processed" });
    } catch (error) {
      console.error("Pesepay callback error:", error.message);
      res.status(200).json({ success: false, message: error.message });
    }
  }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // STATUS POLLING
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /**
   * GET /api/payments/status/:referenceNumber
   * Unified status endpoint.
   */
  async checkPaymentStatus(req, res) {
    try {
      const { referenceNumber } = req.params;

      if (!referenceNumber) {
        return res.status(400).json({ success: false, message: "referenceNumber is required" });
      }

      const payment = await Payment.findOne({ where: { referenceNumber } });
      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      const provider = this._providerOf(payment);

      if (provider === "ECOCASH") {
        const result = await ecocashService.checkPaymentStatus(referenceNumber);
        return res.status(200).json({ success: true, provider: "ECOCASH", payment: result });
      }

      const result = await pesepayService.checkPaymentStatus(referenceNumber);
      return res.status(200).json({ success: true, provider: "PESEPAY", ...result });
    } catch (error) {
      console.error("checkPaymentStatus error:", error?.response?.data ?? error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/payments/poll-status
   * Alternative status check when frontend has a pollUrl.
   */
  async pollPaymentStatus(req, res) {
    try {
      const { pollUrl, referenceNumber } = req.body;

      if (referenceNumber) {
        return this.checkPaymentStatus({ params: { referenceNumber } }, res);
      }

      if (!pollUrl) {
        return res.status(400).json({
          success: false,
          message: "Either pollUrl or referenceNumber is required",
        });
      }

      const result = await pesepayService.pollPaymentStatus(pollUrl);
      res.json({ success: true, provider: "PESEPAY", ...result });
    } catch (error) {
      console.error("pollPaymentStatus error:", error?.response?.data ?? error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

async getUserPurchases(req, res) {
  try {
    const purchases = await Plaque.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: Album,
          as: "plaqueAlbum",
          attributes: ["id", "title", "cover_art"],
          include: [{ model: Artist, as: "artist", attributes: ["id", "name", "stageName", "profilePictureUrl"] }],
        },
        {
          model: Payment,
          as: "plaquePayment",
          attributes: ["id", "referenceNumber", "status", "amount", "currency"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    console.error("getUserPurchases error:", error.message);
    res.status(500).json({ success: false, message: "Error fetching purchases" });
  }
}

/**
 * GET /api/payments/my-awarded-plaques
 */
async getMyAwardedPlaques(req, res) {
  try {
    const plaques = await Plaque.findAll({
      where: { ownerId: req.user.id },
      include: [
        {
          model: Album,
          as: "plaqueAlbum",
          required: false,
          attributes: ["id", "title", "cover_art"],
          include: [
            {
              model: Artist,
              as: "artist",
              required: false,
              attributes: ["id", "name", "stageName", "profilePictureUrl"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const data = plaques.map((plaque) => {
      const album = plaque.plaqueAlbum || null;
      const artist = album?.artist || null;

      return {
        id: plaque.id,
        serialNumber: plaque.serialNumber,
        plaqueType: plaque.plaqueType,
        plaqueImageUrl: plaque.plaqueImageUrl,          // ← ADD
        status: plaque.status,
        amount: plaque.amount,
        ownerType: plaque.ownerType,
        thankYouNoteOnly: plaque.thankYouNoteOnly,      // ← ADD (drives thankyou.png on the client)
        isDemo: plaque.isDemo,                          // ← ADD (so the client can badge demo plaques)
        shippingAddress: plaque.shippingAddress,
        trackingNumber: plaque.trackingNumber,
        issuedAt: plaque.issuedAt,
        deliveredAt: plaque.deliveredAt,
        collectedAt: plaque.collectedAt,                // ← ADD (part of the lifecycle)
        createdAt: plaque.createdAt,
        album: album
          ? { id: album.id, title: album.title, coverImage: album.cover_art }
          : null,
        artist: artist
          ? {
              id: artist.id,
              name: artist.stageName || artist.name,
              profileImage: artist.profilePictureUrl || null,
            }
          : null,
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("getMyAwardedPlaques error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching awarded plaques",
    });
  }
}

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ADMIN â€” VERIFICATION & NOTIFICATIONS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /**
   * POST /api/payments/verify/:referenceNumber
   * Admin: manually trigger a fulfillment check.
   */
  async verifyTransaction(req, res) {
    try {
      const { referenceNumber } = req.params;

      if (!referenceNumber) {
        return res.status(400).json({ success: false, message: "Reference number required" });
      }

      const payment = await Payment.findOne({ where: { referenceNumber } });
      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      const provider = this._providerOf(payment);
      let result;

      if (provider === "ECOCASH") {
        result = await ecocashService.checkPaymentStatus(referenceNumber);
      } else {
        result = await pesepayService.checkAndFulfillPayment(referenceNumber);
      }

      res.json({ success: true, message: "Verification check complete", data: result });
    } catch (error) {
      console.error("verifyTransaction error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/payments/:id/notify-failed
   * Admin: send a transaction-failed email to the customer.
   */
  async notifyTransactionFailed(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findByPk(id);

      if (!payment) {
        return res.status(404).json({ success: false, message: "Payment not found" });
      }

      if (!["FAILED", "cancelled"].includes(payment.status)) {
        return res.status(400).json({
          success: false,
          message: "Transaction is not marked as failed. Current status: " + payment.status,
        });
      }

      const user = await User.findOne({ where: { email: payment.customerEmail } });
      const username = user ? user.userName : "Valued Customer";

      await emailService.sendTransactionFailedEmail(payment.customerEmail, username, {
        referenceNumber: payment.referenceNumber,
        amount: payment.amount,
        currency: payment.currency,
        albumName: payment.reason,
        createdAt: payment.createdAt,
      });

      res.json({ success: true, message: "Failure notification sent successfully" });
    } catch (error) {
      console.error("notifyTransactionFailed error:", error.message);
      res.status(500).json({ success: false, message: "Server error sending notification" });
    }
  }
}

module.exports = new PaymentController();




