// ─── Environment guards ────────────────────────────────────────────────────────
if (!process.env.RESULT_URL || !process.env.RETURN_URL) {
  throw new Error("RESULT_URL and RETURN_URL must be set in .env");
}
if (!process.env.PESEPAY_PROD_INTEGRATION_KEY || !process.env.PESEPAY_PROD_ENCRYPTION_KEY) {
  throw new Error(
    "PESEPAY_PROD_INTEGRATION_KEY and PESEPAY_PROD_ENCRYPTION_KEY must be set in .env"
  );
}
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
const { PesePayClient } = require("pesepay-js");
const { Payment,  Album, Plaque,Artist, AlbumLaunch,User } = require("../models");

const integrationKey = process.env.PESEPAY_PROD_INTEGRATION_KEY.trim();
const encryptionKey  = process.env.PESEPAY_PROD_ENCRYPTION_KEY.trim();
const isProduction   = process.env.NODE_ENV === "production";

const client = new PesePayClient(integrationKey, encryptionKey);

console.log(`💳 PesePay (PRODUCTION) service initialised [${isProduction ? "PROD" : "DEV"}]`);
console.log(`🔑 Integration key prefix: ${integrationKey.substring(0, 8)}...`);

// ─── InnBucks payment method code ─────────────────────────────────────────────
const INNBUCKS_CODE = "PZW212";

class PesepayService {

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Normalise a Zimbabwean mobile number to 263XXXXXXXXX (12 digits).
   * Returns empty string for blank input rather than throwing —
   * callers should validate presence before calling this.
   */
  _normalizeZwPhone(phone = "") {
    const cleaned = String(phone).replace(/\D/g, "").trim();
    if (!cleaned) return "";
    if (cleaned.startsWith("263") && cleaned.length === 12) return cleaned;
    if (cleaned.startsWith("0")   && cleaned.length === 10) return "263" + cleaned.slice(1);
    if (cleaned.startsWith("7")   && cleaned.length === 9)  return "263" + cleaned;
    return cleaned; // return as-is and let Pesepay validate
  }

  /**
   * Extract the best error message from a Pesepay/axios error object.
   */
  _errMsg(error) {
    return (
      error?.response?.data?.message  ||
      error?.response?.data?.description ||
      error?.response?.data?.error    ||
      error?.message                  ||
      "PesePay request failed"
    );
  }

  /**
   * Idempotent fulfillment core.
   * Safe to call multiple times for the same referenceNumber.
   *
   * @param {object} payment        - Sequelize Payment instance
   * @param {object} providerResp   - Response from client.checkPaymentStatus()
   * @returns {{ status: "SUCCESS"|"FAILED"|"ALREADY_PROCESSED" }}
   */

  /**
 * Demo bypass — if the user has isDemoAccount and the album isDemo,
 * create Payment + Plaque synchronously with SUCCESS/PAID, skip Pesepay.
 * Returns null if not a demo case (caller should continue normal flow).
 */
async _tryDemoBypass({ userId, albumId, plaqueType, amount, currencyCode, email, phone, paymentMethodLabel }) {
  const user = await User.findByPk(userId);
  if (!user?.isDemoAccount) return null;

  const album = await Album.findByPk(albumId, {
    include: [{ model: AlbumLaunch, as: "launch" }],
  });
  if (!album) throw new Error("Album not found");
  if (!album.isDemo) throw new Error("Demo accounts can only interact with demo albums");

  const launch = album.launch;
  const launchService = require("./launchService");
  const status = launchService.effectiveStatus(launch);
  const launchIsActive = status === "active";

  const referenceNumber = `DEMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const payment = await Payment.create({
    userId,
    albumId,
    plaqueType,
    referenceNumber,
    status: "SUCCESS",
    amount: Number(amount),
    currency: currencyCode,
    reason: `${plaqueType} DEMO purchase for ${album.title}`,
    paid: true,
    customerEmail: email,
    customerPhone: phone,
    paymentMethod: paymentMethodLabel || "DEMO",
    isDemo: true,
  });

  let plaque = null;

  if (launchIsActive) {
    const { pickTier } = require("./supportService");
    const tier = pickTier(amount, launch.tierThresholds);
    if (tier) {
      const serialService = require("./serialService");
      const serialNumber = await serialService.generateSerialNumber(tier);
      const verificationCode = serialService.generateVerificationCode();

      plaque = await Plaque.create({
        serialNumber,
        verificationCode,
        plaqueType: tier,
        amount,
        ownerType: "FAN",
        plaqueImage: plaqueImageFor(tier, !tier),
        ownerId: userId,
        albumId,
        artistId: album.artistId,
        paymentId: payment.id,
        status: "PAID",
        issuedAt: new Date(),
        isVerified: true,
        verifiedAt: new Date(),
        isDemo: true,
      });
    }
  }

  return {
    success: true,
    demo: true,
    referenceNumber,
    payment,
    plaque,
    redirectUrl: null,
    pollUrl: null,
  };
}
async _fulfill(payment, providerResp) {
  if (payment.status === "SUCCESS" && payment.paid) {
    return { status: "ALREADY_PROCESSED" };
  }

  const isPaid = providerResp.transactionStatus === "SUCCESS";

  if (isPaid) {
    let plaque = await Plaque.findOne({ where: { paymentId: payment.id } });

    // Case 1: Support-flow plaque exists, awaiting payment
    if (plaque && plaque.status === "PENDING_PAYMENT") {
      const { generateDigitalHash } = require("../utils/plaqueIntegrity");
      const owner = await User.findByPk(payment.userId);
      const album = await Album.findByPk(payment.albumId, {
        include: [{ model: Artist, as: "artist" }],
      });

      const { hash } = generateDigitalHash({
        serialNumber: plaque.serialNumber,
        verificationCode: plaque.verificationCode,
        ownerName: plaque.ownerName || owner?.userName || "Unknown Owner",
        amount: plaque.amount,
        plaqueType: plaque.plaqueType,
        status: "PAID",
        albumTitle: album?.title || "",
        artistName: album?.artist?.stageName || album?.artist?.name || "",
        paymentReference: payment.referenceNumber,
        paymentStatus: "SUCCESS",
        finalizedAt: new Date().toISOString(),
      });

      await plaque.update({
        status: "PAID",
        issuedAt: plaque.issuedAt || new Date(),
        verificationHash: hash,
        isVerified: true,
        verifiedAt: new Date(),
      });

      console.log(`✅ Plaque marked PAID: ${plaque.serialNumber}`);
    }

    // Case 2: Payment-flow qualified for a plaque at initiate time — create it now
    else if (!plaque && payment.qualifiesForPlaque && payment.qualifiedTier) {
      const serialService = require("./serialService");
      const { generateDigitalHash } = require("../utils/plaqueIntegrity");

      const album = await Album.findByPk(payment.albumId, {
        include: [{ model: Artist, as: "artist" }],
      });
      if (!album) throw new Error(`Album not found: ${payment.albumId}`);

      const owner = await User.findByPk(payment.userId);

      const serialNumber = await serialService.generateSerialNumber(payment.qualifiedTier);
      const verificationCode = serialService.generateVerificationCode();

      const { hash } = generateDigitalHash({
        serialNumber,
        verificationCode,
        ownerName: owner?.userName || "Unknown Owner",
        amount: payment.amount,
        plaqueType: payment.qualifiedTier,
        status: "PAID",
        albumTitle: album.title,
        artistName: album.artist?.stageName || album.artist?.name || "",
        paymentReference: payment.referenceNumber,
        paymentStatus: "SUCCESS",
        finalizedAt: new Date().toISOString(),
      });

      plaque = await Plaque.create({
        serialNumber,
        verificationCode,
        plaqueType: payment.qualifiedTier,
        plaqueImage: plaqueImageFor(payment.qualifiedTier, !payment.qualifiedTier),
        amount: payment.amount,
        ownerType: "FAN",

        ownerId: payment.userId,
        albumId: payment.albumId,
        artistId: album.artistId,
        paymentId: payment.id,
        status: "PAID",
        issuedAt: new Date(),
        verificationHash: hash,
        isVerified: true,
        verifiedAt: new Date(),
      });

      console.log(`✅ Plaque created for payment: ${plaque.serialNumber}`);
    }

    // Case 3: no plaque — post-launch support or below threshold
    else if (!plaque) {
      const reason = payment.qualifiesForPlaque === false
        ? "post-launch or below threshold"
        : "no plaque decision recorded";
      console.log(`ℹ️  No plaque for payment ${payment.referenceNumber} — ${reason}`);
    }

    await payment.update({ status: "SUCCESS", paid: true });
    return { status: "SUCCESS" };
  }

  await payment.update({ status: "FAILED", paid: false });
  return { status: "FAILED" };
}
  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns all currencies active on Pesepay (USD, ZWG, etc.).
   */
  async getActiveCurrencies() {
    try {
      const data = await client.getActiveCurrencies();
      return { success: true, data };
    } catch (error) {
      console.error("getActiveCurrencies error:", error?.response?.data ?? error.message);
      throw new Error(this._errMsg(error));
    }
  }

  /**
   * Returns payment methods available for a given currency code.
   * @param {string} currencyCode - e.g. "USD", "ZWG"
   */
  async getPaymentMethodsByCurrency(currencyCode = "USD") {
    try {
      const data = await client.getPaymentMethodsByCurrency(currencyCode);
      return { success: true, data };
    } catch (error) {
      console.error("getPaymentMethodsByCurrency error:", error?.response?.data ?? error.message);
      throw new Error(this._errMsg(error));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REDIRECT FLOW  (customer is redirected to Pesepay hosted page)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initiate a redirect-based plaque purchase.
   * Returns { redirectUrl, referenceNumber } — frontend opens the redirectUrl.
   * Final status arrives via the Pesepay callback webhook.
   *
   * @param {{ userId, albumId, plaqueType, amount, email, phone, currencyCode, albumTitle, artistName }} data
   */
  async initiatePlaquePurchase(data) {
    const {
      amount, userId, email, phone,
      albumId, plaqueType, currencyCode,
      albumTitle, artistName,qualifiesForPlaque, qualifiedTier,
    } = data;
 const demoResult = await this._tryDemoBypass({
    userId, albumId, plaqueType, amount, currencyCode, email, phone,
    paymentMethodLabel: "PESEPAY",
  });
  if (demoResult) return demoResult;
    const reason = `${plaqueType} purchase for ${albumTitle} by ${artistName}`;

    try {
      const response = await client.initiateTransaction({
        amountDetails:    { amount: Number(amount), currencyCode },
        reasonForPayment: reason,
        resultUrl:        process.env.RESULT_URL,
        returnUrl:        process.env.RETURN_URL,
      });

      await Payment.create({
        userId, albumId, plaqueType,
        referenceNumber: response.referenceNumber,
        status:          "PENDING",
        amount:          Number(amount),
        currency:        currencyCode,
        reason,
        paid:            false,
        customerEmail:   email,
        customerPhone:   phone,
        paymentMethod:   "PESEPAY",
        qualifiesForPlaque,
        qualifiedTier,
         plaqueImageUrl: plaqueImageFor(tier, !tier),
      });

      console.log(`💳 Pesepay redirect initiated: ${response.referenceNumber}`);

      return {
        success:         true,
        redirectUrl:     response.redirectUrl,
        referenceNumber: response.referenceNumber,
      };
    } catch (error) {
      console.error("initiatePlaquePurchase error:", error?.response?.data ?? error.message);
      throw new Error(this._errMsg(error));
    }
  }

  /**
   * Initiate an InnBucks redirect purchase.
   * Uses the same Pesepay redirect flow but stores paymentMethod as PZW212.
   *
   * @param {{ userId, albumId, plaqueType, amount, email, phone, currencyCode, albumTitle, artistName }} data
   */
  async initiateInnbucksPurchase(data) {
    const {
      amount, userId, email, phone,
      albumId, plaqueType, currencyCode,
      albumTitle, artistName,
    } = data;

    if (!phone || String(phone).trim() === "") {
      throw new Error("Phone number is required for InnBucks.");
    }

    const reason = `${plaqueType} purchase for ${albumTitle} by ${artistName}`;

    try {
      const response = await client.initiateTransaction({
        amountDetails:    { amount: Number(amount), currencyCode },
        reasonForPayment: reason,
        resultUrl:        process.env.RESULT_URL,
        returnUrl:        process.env.RETURN_URL,
      });

      await Payment.create({
        userId, albumId, plaqueType,
        referenceNumber: response.referenceNumber,
        status:          "PENDING",
        amount:          Number(amount),
        currency:        currencyCode,
        reason,
        paid:            false,
        customerEmail:   email,
        customerPhone:   this._normalizeZwPhone(phone),
        paymentMethod:   INNBUCKS_CODE,
      });

      console.log(`💳 InnBucks redirect initiated: ${response.referenceNumber}`);

      return {
        success:         true,
        redirectUrl:     response.redirectUrl,
        referenceNumber: response.referenceNumber,
      };
    } catch (error) {
      console.error("initiateInnbucksPurchase error:", error?.response?.data ?? error.message);
      throw new Error(this._errMsg(error));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEAMLESS FLOW  (payment happens inline, no redirect)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initiate a seamless (inline) payment — EcoCash via Pesepay, OneMoney, etc.
   * Returns { pollUrl, referenceNumber }.
   * Frontend polls GET /status/:referenceNumber until terminal === true.
   *
   * @param {{
   *   userId, albumId, plaqueType, amount, email, phone,
   *   paymentMethodCode, requiredFields?, currencyCode,
   *   albumTitle, artistName
   * }} data
   */
 async initiateSeamlessPayment(data) {
  const {
    amount, userId, email, phone,
    albumId, plaqueType,
    paymentMethodCode, requiredFields = {},
    currencyCode, albumTitle, artistName,
    qualifiesForPlaque, qualifiedTier,   // ← snapshot fields from the controller
  } = data;
   const demoResult = await this._tryDemoBypass({
    userId, albumId, plaqueType, amount, currencyCode, email, phone,
    paymentMethodLabel: "PESEPAY",
  });
  if (demoResult) return demoResult;

  const normalizedPhone = this._normalizeZwPhone(phone);
  const reason = `${plaqueType} purchase for ${albumTitle} by ${artistName}`;

  // Ensure customerPhoneNumber lands in requiredFields for methods
  // (EcoCash, OneMoney) that demand it separately from customer.phoneNumber.
  const normalizedRequiredFields = {
    ...requiredFields,
    ...(phone && !requiredFields.customerPhoneNumber
      ? { customerPhoneNumber: normalizedPhone }
      : {}),
    ...(requiredFields.customerPhoneNumber
      ? { customerPhoneNumber: this._normalizeZwPhone(requiredFields.customerPhoneNumber) }
      : {}),
  };

  try {
    const response = await client.makeSeamlessPayment({
      amountDetails: { amount: Number(amount), currencyCode },
      merchantReference:          `REF-${Date.now()}`,
      reasonForPayment:           reason,
      resultUrl:                  process.env.RESULT_URL,
      returnUrl:                  process.env.RETURN_URL,
      paymentMethodCode,
      customer: {
        email,
        phoneNumber: normalizedPhone,
        name:        `User ${userId}`,
      },
      paymentMethodRequiredFields: normalizedRequiredFields,
    });

    await Payment.create({
      userId, albumId, plaqueType,
      referenceNumber: response.referenceNumber,
      status:          "PENDING",
      amount:          Number(amount),
      currency:        currencyCode,
      reason,
      paid:            false,
      customerEmail:   email,
      customerPhone:   normalizedPhone,
      paymentMethod:   paymentMethodCode,
      qualifiesForPlaque,   // ← persist snapshot
      qualifiedTier,        // ← persist snapshot
    });

    console.log(`💳 Pesepay seamless initiated [${paymentMethodCode}]: ${response.referenceNumber}`);

    return {
      success:         true,
      pollUrl:         response.pollUrl,
      referenceNumber: response.referenceNumber,
    };
  } catch (error) {
    console.error("initiateSeamlessPayment error:", error?.response?.data ?? error.message);
    throw new Error(this._errMsg(error));
  }
}

  /**
   * Convenience wrapper for InnBucks seamless payments.
   * Forces paymentMethodCode to PZW212.
   */
  async initiateInnbucksSeamlessPayment(data) {
     const demoResult = await this._tryDemoBypass({
    userId, albumId, plaqueType, amount, currencyCode, email, phone,
    paymentMethodLabel: "PESEPAY",
  });
  if (demoResult) return demoResult;
    if (!data.phone || String(data.phone).trim() === "") {
      throw new Error("Phone number is required for InnBucks.");
    }
    return this.initiateSeamlessPayment({ ...data, paymentMethodCode: INNBUCKS_CODE });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS CHECK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check payment status.
   *
   * Strategy:
   *   1. Read from DB first — if already terminal (SUCCESS/FAILED), skip external call.
   *   2. Otherwise call Pesepay API.
   *   3. If Pesepay says SUCCESS, trigger background fulfillment.
   *
   * Always returns a `terminal` boolean so the frontend knows when to stop polling.
   *
   * @param {string} referenceNumber
   */
  async checkPaymentStatus(referenceNumber) {
    const payment = await Payment.findOne({ where: { referenceNumber } });

    // DB-first: already terminal — no need to hit the API
    if (payment && payment.status === "SUCCESS" && payment.paid) {
      return {
        referenceNumber,
        transactionStatus: "SUCCESS",
        status:            "SUCCESS",
        paid:              true,
        amount:            payment.amount,
        currency:          payment.currency,
        paymentMethod:     payment.paymentMethod,
        terminal:          true,
      };
    }

    if (payment && payment.status === "FAILED") {
      return {
        referenceNumber,
        transactionStatus: "FAILED",
        status:            "FAILED",
        paid:              false,
        amount:            payment.amount,
        currency:          payment.currency,
        paymentMethod:     payment.paymentMethod,
        terminal:          true,
      };
    }

    // Still PENDING — ask Pesepay
    try {
      const response = await client.checkPaymentStatus(referenceNumber);

      console.log(`🔍 Pesepay status [${referenceNumber}]:`, response.transactionStatus);

      // Trigger fulfillment in the background when Pesepay confirms success
      if (response.transactionStatus === "SUCCESS" && payment) {
        this._fulfill(payment, response).catch((err) =>
          console.error(`Background fulfillment error [${referenceNumber}]:`, err.message)
        );
      }

      return {
        ...response,
        terminal: ["SUCCESS", "FAILED"].includes(response.transactionStatus),
      };
    } catch (error) {
      console.error("checkPaymentStatus error:", error?.response?.data ?? error.message);
      throw new Error(this._errMsg(error));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FULFILLMENT  (webhook callback + manual admin trigger)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Called from the Pesepay result-URL callback (webhook).
   * Queries Pesepay for the final status, then fulfills if paid.
   * Idempotent — safe to call multiple times.
   *
   * @param {string} referenceNumber
   */
  async checkAndFulfillPayment(referenceNumber) {
    const payment = await Payment.findOne({ where: { referenceNumber } });

    if (!payment) {
      throw new Error(`Payment not found: ${referenceNumber}`);
    }

    // Already done
    if (payment.status === "SUCCESS" && payment.paid) {
      return { status: "ALREADY_PROCESSED" };
    }

    let providerResp;
    try {
      providerResp = await client.checkPaymentStatus(referenceNumber);
    } catch (error) {
      console.error(
        `checkAndFulfillPayment: Pesepay API error [${referenceNumber}]:`,
        error?.response?.data ?? error.message
      );
      throw new Error(this._errMsg(error));
    }

    return this._fulfill(payment, providerResp);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POLL BY URL  (frontend seamless polling)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Called when frontend has a pollUrl from the seamless initiation response.
   * Extracts referenceNumber from the URL and delegates to checkPaymentStatus.
   *
   * @param {string} pollUrl - full URL containing referenceNumber query param
   */
  async pollPaymentStatus(pollUrl) {
    let referenceNumber;

    try {
      const url = new URL(pollUrl);
      referenceNumber = url.searchParams.get("referenceNumber");
    } catch {
      throw new Error("Invalid pollUrl — must be a valid URL");
    }

    if (!referenceNumber) {
      throw new Error("Could not extract referenceNumber from pollUrl");
    }

    return this.checkPaymentStatus(referenceNumber);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER PURCHASES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * @param {string} userId
   */
 async getUserPurchases(userId) {
  return Plaque.findAll({
    where: { ownerId: userId },
    include: [
      {
        model: Album,
        as: "plaqueAlbum",
        attributes: ["title", "cover_art"],
        include: [
          { model: Artist, as: "artist", attributes: ["name", "stageName"] },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Admin: list Pesepay payments with optional status filter + pagination.
   * @param {{ status?, page?, limit? }} opts
   */
  async getAllPayments({ status, page = 1, limit = 20 } = {}) {
    const { Op } = require("sequelize");

    const where = {
      paymentMethod: { [Op.notIn]: ["ECOCASH"] }, // all Pesepay variants
    };
    if (status) where.status = status.toUpperCase();

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User,  attributes: ["userName", "email"], required: false },
        { model: Album, attributes: ["title"],             required: false },
      ],
      order:  [["createdAt", "DESC"]],
      limit:  parseInt(limit),
      offset,
    });

    return {
      total:    count,
      page:     parseInt(page),
      limit:    parseInt(limit),
      pages:    Math.ceil(count / parseInt(limit)),
      payments: rows,
    };
  }

  /**
   * Admin: manually mark a PENDING payment as FAILED.
   * Blocks marking an already-SUCCESS payment.
   *
   * @param {string} referenceNumber
   * @param {{ reason?, adminUserName? }} meta
   */
  async adminMarkFailed(referenceNumber, { reason, adminUserName } = {}) {
    const payment = await Payment.findOne({ where: { referenceNumber } });

    if (!payment) throw new Error(`Payment not found: ${referenceNumber}`);

    if (payment.status === "SUCCESS" && payment.paid) {
      throw new Error("Cannot mark a successfully completed payment as failed");
    }

    await payment.update({
      status: "FAILED",
      paid:   false,
      providerResponsePayload: {
        ...(payment.providerResponsePayload || {}),
        manuallyFailed: true,
        failedBy:       adminUserName || "admin",
        failedAt:       new Date().toISOString(),
        reason:         reason || "Manually marked as failed by admin",
      },
    });

    return { status: "FAILED", referenceNumber };
  }

  /**
   * Admin: manually fulfill a payment when Pesepay callback was missed.
   * Calls Pesepay API one more time to confirm, then fulfills if successful.
   * If Pesepay still says not paid, throws with the provider status.
   *
   * @param {string} referenceNumber
   */
  async adminForceVerifyAndFulfill(referenceNumber) {
    const payment = await Payment.findOne({ where: { referenceNumber } });
    if (!payment) throw new Error(`Payment not found: ${referenceNumber}`);

    if (payment.status === "SUCCESS" && payment.paid) {
      return { status: "ALREADY_PROCESSED" };
    }

    let providerResp;
    try {
      providerResp = await client.checkPaymentStatus(referenceNumber);
    } catch (error) {
      throw new Error(`Pesepay API error: ${this._errMsg(error)}`);
    }

    if (providerResp.transactionStatus !== "SUCCESS") {
      throw new Error(
        `Pesepay still reports status "${providerResp.transactionStatus}" — cannot force fulfill`
      );
    }

    return this._fulfill(payment, providerResp);
  }
}

module.exports = new PesepayService();