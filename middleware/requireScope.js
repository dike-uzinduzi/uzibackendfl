/**
 * Rejects tokens that carry a non-session scope.
 * Use on all "real" authenticated routes (login-only territory).
 */
function rejectSignupPending(req, res, next) {
  if (req.user?.scope === "signup_pending") {
    return res.status(403).json({
      success: false,
      message: "Complete signup before using this endpoint",
      code: "SIGNUP_PENDING",
    });
  }
  next();
}

/**
 * Only accepts tokens with scope = signup_pending.
 * Use on /social-complete.
 */
function requireSignupPending(req, res, next) {
  if (req.user?.scope !== "signup_pending") {
    return res.status(403).json({
      success: false,
      message: "Invalid token for this endpoint",
    });
  }
  next();
}

module.exports = { rejectSignupPending, requireSignupPending };