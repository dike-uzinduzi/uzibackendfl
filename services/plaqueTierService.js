const { PlaqueTier } = require("../models");

class PlaqueTierService {

  async listActive() {
    return PlaqueTier.findAll({
      where: { isActive: true },
      order: [["order", "ASC"]],
    });
  }

  async listAll() {
    return PlaqueTier.findAll({
      order: [["order", "ASC"]],
    });
  }

  async findById(id) {
    const tier = await PlaqueTier.findByPk(id);
    if (!tier) throw new Error("Plaque tier not found");
    return tier;
  }

  async findBySlug(slug) {
    return PlaqueTier.findOne({ where: { slug } });
  }

  async create(data) {
    const slug = String(data.slug || "").trim().toUpperCase();
    if (!slug) throw new Error("slug is required");

    const existing = await PlaqueTier.findOne({ where: { slug } });
    if (existing) throw new Error(`Tier "${slug}" already exists`);

    return PlaqueTier.create({
      slug,
      displayName: data.displayName || slug,
      minAmount: data.minAmount,
      order: data.order ?? 0,
      imageUrl: data.imageUrl || null,
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      freeShowDays: data.freeShowDays ?? null,
      isActive: data.isActive ?? true,
    });
  }

  async update(id, data) {
    const tier = await PlaqueTier.findByPk(id);
    if (!tier) throw new Error("Plaque tier not found");

    const patch = {};

    if (data.slug !== undefined) {
      const slug = String(data.slug).trim().toUpperCase();
      const clash = await PlaqueTier.findOne({
        where: { slug, id: { [require("sequelize").Op.ne]: id } },
      });
      if (clash) throw new Error(`Tier "${slug}" already exists`);
      patch.slug = slug;
    }
    if (data.displayName !== undefined) patch.displayName = data.displayName;
    if (data.minAmount !== undefined) patch.minAmount = data.minAmount;
    if (data.order !== undefined) patch.order = data.order;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
    if (data.benefits !== undefined) {
      patch.benefits = Array.isArray(data.benefits) ? data.benefits : [];
    }
    if (data.freeShowDays !== undefined) patch.freeShowDays = data.freeShowDays;
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    await tier.update(patch);
    return tier;
  }

  /**
   * Picks the highest tier whose minAmount <= amount.
   * Returns null when below the lowest active tier.
   */
  async tierForAmount(amount) {
    const tiers = await PlaqueTier.findAll({
      where: { isActive: true },
      order: [["minAmount", "DESC"]],
    });
    for (const t of tiers) {
      if (Number(amount) >= Number(t.minAmount)) return t;
    }
    return null;
  }

  async softDelete(id) {
    const tier = await PlaqueTier.findByPk(id);
    if (!tier) throw new Error("Plaque tier not found");
    await tier.update({ isActive: false });
    return tier;
  }
}

module.exports = new PlaqueTierService();