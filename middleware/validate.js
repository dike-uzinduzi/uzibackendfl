/**
 * Lightweight request body validator.
 * Usage: validate(["email","password"])
 */
const validate = (requiredFields) => (req, res, next) => {
  const missing = requiredFields.filter((f) => {
    const v = req.body[f];
    return v === undefined || v === null || String(v).trim() === "";
  });

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }
  next();
};

module.exports = { validate };
