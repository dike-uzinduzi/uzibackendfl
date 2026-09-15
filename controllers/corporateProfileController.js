const { CorporateProfile, User } = require("../models");

// Reusable include for the account owner
const ACCOUNT_OWNER_INCLUDE = {
  model: User,
  as: "accountOwner",
  attributes: ["id", "userName", "email", "role", "isEmailVerified"],
};

// ─── Admin: list all ──────────────────────────────────────
exports.getAllCorporateProfiles = async (req, res) => {
  try {
    const profiles = await CorporateProfile.findAll({
      include: [ACCOUNT_OWNER_INCLUDE],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: profiles,
      count: profiles.length,
    });
  } catch (error) {
    console.error("getAllCorporateProfiles error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Self: read own profile ───────────────────────────────
exports.getMyCorporateProfile = async (req, res) => {
  try {
    if (req.user.role !== "corporate") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only corporate accounts can access this profile.",
      });
    }

    const profile = await CorporateProfile.findOne({
      where: { userId: req.user.id },
      include: [ACCOUNT_OWNER_INCLUDE],
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Corporate profile not found",
      });
    }

    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error("getMyCorporateProfile error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Self: create or update own profile ───────────────────
exports.updateMyCorporateProfile = async (req, res) => {
  try {
    if (req.user.role !== "corporate") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only corporate accounts can update this profile.",
      });
    }

    // Fields the corporate user can edit about themselves.
    // Excludes isActive, verifiedAt, userId, id, logoUrl, coverPhoto (media pipeline).
    const allowedFields = [
      "companyName",
      "industry",
      "csrFocus",
      "monthlyBudget",
      "taxId",
      "websiteUrl",
      "officialEmail",
      "companyBio",
      "corpAddress",
      "socialLinks",
    ];

    const data = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    let profile = await CorporateProfile.findOne({
      where: { userId: req.user.id },
    });

    if (profile) {
      await profile.update(data);
    } else {
      profile = await CorporateProfile.create({
        userId: req.user.id,
        ...data,
      });
    }

    const updated = await CorporateProfile.findOne({
      where: { userId: req.user.id },
      include: [ACCOUNT_OWNER_INCLUDE],
    });

    return res.json({
      success: true,
      message: "Corporate profile updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateMyCorporateProfile error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─── Admin: lookup by user id ─────────────────────────────
exports.getCorporateProfileByUserId = async (req, res) => {
  try {
    const profile = await CorporateProfile.findOne({
      where: { userId: req.params.userId },
      include: [ACCOUNT_OWNER_INCLUDE],
    });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Corporate profile not found" });
    }
    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error("getCorporateProfileByUserId error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Public: get by id ────────────────────────────────────
exports.getCorporateProfileById = async (req, res) => {
  try {
    const profile = await CorporateProfile.findByPk(req.params.id, {
      include: [ACCOUNT_OWNER_INCLUDE],
    });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Corporate profile not found" });
    }

    // Public read — strip sensitive fields
    const plain = profile.get({ plain: true });
    delete plain.taxId;
    delete plain.monthlyBudget;
    delete plain.officialEmail;

    return res.json({ success: true, data: plain });
  } catch (error) {
    console.error("getCorporateProfileById error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};