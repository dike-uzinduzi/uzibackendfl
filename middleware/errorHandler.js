/**
 * Centralised async error wrapper.
 * Wrap any async route handler: router.get('/', asyncHandler(ctrl.myMethod))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler — mount LAST in server.js.
 * Handles CORS rejections, Sequelize errors, JWT errors, and generic 500s.
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err);

  // CORS rejection — the cors() middleware throws this when origin isn't allowed.
  // Must be checked before the generic fallback so it returns 403, not 500.
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  // Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  // Sequelize unique constraint
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors[0]?.path || "field";
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  // Sequelize foreign key violation
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({
      success: false,
      message: "Operation blocked by a related record",
    });
  }

  // Sequelize database errors (missing column, malformed query, etc.)
  if (err.name === "SequelizeDatabaseError") {
    return res.status(500).json({
      success: false,
      // Don't leak the raw SQL in production
      message: process.env.NODE_ENV === "production"
        ? "Database error"
        : err.message,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired." });
  }

  // Custom HTTP status from throw
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  // Default
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

module.exports = { asyncHandler, globalErrorHandler };