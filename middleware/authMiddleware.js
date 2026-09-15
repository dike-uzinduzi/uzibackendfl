const jwt = require("jsonwebtoken");
const { User } = require("../models");

// =========================
// AUTH MIDDLEWARE
// =========================
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded._id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    req.user = user.get({ plain: true });
    req.user.scope = decoded.scope || null;

    // Reject pending-signup tokens on all routes
    // unless the route explicitly opted in via allowSignupPending
    if (req.user.scope === "signup_pending" && !req.allowSignupPending) {
      return res.status(403).json({
        success: false,
        message: "Complete signup before using this endpoint",
        code: "SIGNUP_PENDING",
      });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Opt-in middleware for /social-complete
const allowSignupPending = (req, res, next) => {
  req.allowSignupPending = true;
  next();
};

// =========================
// ROLE-BASED ACCESS CONTROL
// =========================
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};

// ─── Specific role middlewares ──────────────────────────────
const adminMiddleware      = authorizeRoles("admin", "super_admin");
const superAdminMiddleware = authorizeRoles("super_admin");

const artistMiddleware = authorizeRoles("artist", "admin", "super_admin");

const supporterMiddleware = authorizeRoles(
  "fan", "corporate", "admin", "super_admin"
);

const managementMiddleware = authorizeRoles(
  "artist_manager", "admin", "super_admin"
);

const canCreateAdminMiddleware = authorizeRoles("super_admin");
const corporateMiddleware = authorizeRoles("corporate", "admin", "super_admin");
// ─── Generic guard factory ──────────────────────────────────
const requireRole = (...roles) => {
  const flat = roles.flat();
  return (req, res, next) => {
    if (!flat.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${flat.join(", ")}.`,
      });
    }
    next();
  };
};

// ─── Email verification gate ────────────────────────────────
const emailVerifiedMiddleware = (req, res, next) => {
  const rolesRequiringVerification = [
    "fan", "artist", "producer", "artist_manager", "promoter", "corporate",
  ];

  if (
    rolesRequiringVerification.includes(req.user.role) &&
    !req.user.isEmailVerified
  ) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address first.",
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  allowSignupPending,
  authorizeRoles,
  adminMiddleware,
  superAdminMiddleware,
  artistMiddleware,
  supporterMiddleware,
  managementMiddleware,
  canCreateAdminMiddleware,
  corporateMiddleware,
  requireRole,
  emailVerifiedMiddleware,
};