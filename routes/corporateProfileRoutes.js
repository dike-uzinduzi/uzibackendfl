const express = require("express");
const router = express.Router();

const corporateProfileController = require("../controllers/corporateProfileController");
const {
  authMiddleware,
  adminMiddleware,
  corporateMiddleware,
} = require("../middleware/authMiddleware");

// ─── Admin list ────────────────────────────────────────────
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  corporateProfileController.getAllCorporateProfiles
);

// ─── Self routes (before /:id) ─────────────────────────────
router.get(
  "/me",
  authMiddleware,
  corporateMiddleware,
  corporateProfileController.getMyCorporateProfile
);

router.put(
  "/me",
  authMiddleware,
  corporateMiddleware,
  corporateProfileController.updateMyCorporateProfile
);

// ─── Admin: lookup by user ─────────────────────────────────
router.get(
  "/user/:userId",
  authMiddleware,
  adminMiddleware,
  corporateProfileController.getCorporateProfileByUserId
);

// ─── Public read ───────────────────────────────────────────
router.get("/:id", corporateProfileController.getCorporateProfileById);

module.exports = router;