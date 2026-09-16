const express = require("express");
const router = express.Router();

const controller = require("../controllers/plaqueTierController");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

// Public — the app fetches this to render the album detail support pane
router.get("/", controller.listPublic);

// Admin
router.get   ("/admin",     authMiddleware, adminMiddleware, controller.listAll);
router.post  ("/",          authMiddleware, adminMiddleware, controller.create);
router.patch ("/:id",       authMiddleware, adminMiddleware, controller.update);
router.delete("/:id",       authMiddleware, adminMiddleware, controller.remove);

module.exports = router;