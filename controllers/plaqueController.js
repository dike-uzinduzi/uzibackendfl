const plaqueService = require("../services/plaqueService");

class PlaqueController {
  async getAllPlaques(req, res) {
    try {
      const plaques = await plaqueService.findAllPlaques();
      res.json({ success: true, plaques });
    } catch (error) {
      console.error("getAllPlaques error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPlaquesByUser(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const plaques = await plaqueService.findPlaquesByUser(userId);
      res.json({ success: true, plaques });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
async verifyPlaque(req, res) {
  try {
    const { serialNumber } = req.params;
    const { code } = req.query; // optional verification code

    if (!serialNumber) {
      return res.status(400).json({ success: false, message: "serialNumber is required" });
    }

    const result = await plaqueService.verifyPlaque(serialNumber, code || null);

    if (!result.valid) {
      return res.status(404).json({ success: false, message: result.message });
    }

    res.json({ success: true, plaque: result.plaque });
  } catch (error) {
    console.error("verifyPlaque error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
  async getPlaqueById(req, res) {
    try {
      const plaque = await plaqueService.findPlaqueById(req.params.id);
      res.json({ success: true, plaque });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
  async getMyPlaques(req, res) {
    try {
      const plaques = await plaqueService.findPlaquesByUser(req.user.id);
      res.json({ success: true, plaques });
    } catch (error) {
      console.error("getMyPlaques error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  async createPlaque(req, res) {
    try {
      const userId = req.user.id;
      const plaque = await plaqueService.createPlaque(req.body, userId);
      res.status(201).json({ success: true, plaque });
    } catch (error) {
      console.error("createPlaque error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePlaque(req, res) {
    try {
      const plaque = await plaqueService.updatePlaque(req.params.id, req.body);
      res.json({ success: true, plaque });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async deletePlaque(req, res) {
    try {
      await plaqueService.deletePlaque(req.params.id);
      res.json({ success: true, message: "Plaque deleted successfully" });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async finalizePlaque(req, res) {
    try {
      const plaqueId = req.params.id;
      const plaque = await plaqueService.finalizePlaquePurchase(plaqueId);
      res.json({
        success: true,
        message: "Plaque purchase finalized and hashed on blockchain",
        plaque,
      });
    } catch (error) {
      console.error("finalizePlaque error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PlaqueController();
