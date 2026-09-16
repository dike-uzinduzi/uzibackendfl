const plaqueTierService = require("../services/plaqueTierService");

exports.listPublic = async (req, res) => {
  try {
    const tiers = await plaqueTierService.listActive();
    res.json({ success: true, data: tiers, count: tiers.length });
  } catch (err) {
    console.error("listPublic tiers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listAll = async (req, res) => {
  try {
    const tiers = await plaqueTierService.listAll();
    res.json({ success: true, data: tiers, count: tiers.length });
  } catch (err) {
    console.error("listAll tiers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tier = await plaqueTierService.create(req.body);
    res.status(201).json({ success: true, data: tier });
  } catch (err) {
    console.error("create tier error:", err);
    const status = err.message.includes("already exists") ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const tier = await plaqueTierService.update(req.params.id, req.body);
    res.json({ success: true, data: tier });
  } catch (err) {
    console.error("update tier error:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("already exists")
        ? 409
        : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await plaqueTierService.softDelete(req.params.id);
    res.json({ success: true, message: "Plaque tier deactivated" });
  } catch (err) {
    console.error("remove tier error:", err);
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};