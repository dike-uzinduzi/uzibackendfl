const {
  supportAlbum,
  createPesepaySupport,
} = require("../services/supportService");

/**
 * POST /api/albums/:albumId/support
 *
 * Body:
 *   amount, currency, paymentMethod ("ECOCASH" | "PESEPAY"),
 *   paymentMethodCode?, customerPhone?, customerEmail?,
 *   shippingAddress?  { fullName, phone, addressLine1, addressLine2, city, country, postalCode }
 *
 * For demo accounts: creates the payment + plaque instantly (demo bypass).
 * For real accounts: initiates a real Pesepay charge and returns a
 *   redirectUrl (Pesepay redirect) or pollUrl (EcoCash seamless).
 */
exports.support = async (req, res) => {
  try {
    const { albumId } = req.params;
    const {
      amount,
      currency,
      paymentMethod,
      paymentMethodCode,
      customerPhone,
      customerEmail,
      shippingAddress,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "amount must be greater than zero" });
    }
    if (!currency) {
      return res.status(400).json({ success: false, message: "currency is required" });
    }

    const user = req.user;
    const isDemo = Boolean(user?.isDemoAccount);

    // ─── Demo path: instant fulfillment ──────────────────────
    if (isDemo) {
      const result = await supportAlbum({
        albumId,
        userId: user.id,
        amount,
        currency,
        paymentMethod: paymentMethod || "DEMO",
        paymentMethodCode,
        customerPhone: customerPhone || user.phone || null,
        customerEmail: customerEmail || user.email || null,
        shippingAddress: shippingAddress || null,
        user,
      });

      return res.status(201).json({
        success: true,
        demo: true,
        launchIsActive: result.launchIsActive,
        launchStatus: result.launchStatus,
        payment: result.payment,
        plaque: result.plaque,
        message: result.plaque
          ? `Support placed. You have earned a ${result.plaque.plaqueType} plaque.`
          : result.launchIsActive
            ? "Thank you for your support. Every contribution counts."
            : "Support placed. The virtual launch is closed.",
      });
    }

    // ─── Real path: initiate Pesepay ─────────────────────────
    if (!paymentMethod || !["ECOCASH", "PESEPAY"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be ECOCASH or PESEPAY",
      });
    }

    if (paymentMethod === "ECOCASH" && (!customerPhone || String(customerPhone).trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required for EcoCash",
      });
    }

    const result = await createPesepaySupport({
      albumId,
      userId: user.id,
      amount,
      currency,
      paymentMethod,
      paymentMethodCode,
      customerPhone: customerPhone || user.phone || null,
      customerEmail: customerEmail || user.email || null,
      shippingAddress: shippingAddress || null,
    });

    return res.status(201).json({
      success: true,
      demo: false,
      provider: result.provider,
      referenceNumber: result.referenceNumber,
      redirectUrl: result.redirectUrl,
      pollUrl: result.pollUrl,
      plaque: result.plaque,
      launchIsActive: result.launchIsActive,
      message: result.redirectUrl
        ? "Complete your payment in the opened window."
        : "A payment prompt has been sent to your phone.",
    });
  } catch (err) {
    console.error("SUPPORT ERROR:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};