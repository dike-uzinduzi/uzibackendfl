const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const controller = require("../controllers/media.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

const presignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,            // ← req.user.id, not sub
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many uploads. Try again later." },
});

router.post("/me/media/:slot/presign",
  authMiddleware, presignLimiter, controller.presign);

router.post("/me/media/:slot",
  authMiddleware, controller.confirm);

router.delete("/me/media/:slot",
  authMiddleware, controller.reset);

module.exports = router;