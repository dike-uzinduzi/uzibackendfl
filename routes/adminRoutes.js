const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware, adminMiddleware);

router.get("/stats", adminController.stats);
router.get("/users", adminController.listUsers);

module.exports = router;
