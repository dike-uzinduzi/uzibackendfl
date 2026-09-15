const express = require("express");
const router = express.Router({ mergeParams: true });

const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");
const controller = require("../controllers/albumLaunchController");

// Public read
router.get("/", controller.getLaunch);

// Admin-only mutations
router.post("/",   authMiddleware, adminMiddleware, controller.createLaunch);
router.patch("/",  authMiddleware, adminMiddleware, controller.updateLaunch);
router.delete("/", authMiddleware, adminMiddleware, controller.cancelLaunch);

module.exports = router;