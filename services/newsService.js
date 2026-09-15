const { News, User } = require("../models");
const { Op } = require("sequelize");

class NewsService {

  async findAllNews(page = 1, limit = 10, category = null) {
    const offset = (page - 1) * limit;

    const whereClause = {
      is_published: true,
      is_deleted: false,
      expires_at: { [Op.gt]: new Date() },
    };

    if (category) {
      whereClause.category = category;
    }

    const { count, rows } = await News.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "userName"],
          required: false,
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],   // ← was "created_at"
    });

    return {
      news: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async findNewsById(id) {
    const news = await News.findOne({
      where: {
        id,
        is_deleted: false,
        expires_at: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "userName"],
          required: false,
        },
      ],
    });

    if (!news) throw new Error("News not found or expired");
    return news;
  }

  async createNews(newsData, authorId = null) {
    // Default expiry: 2 days from now
    if (!newsData.expires_at) {
      newsData.expires_at = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    }

    // Attach author if provided
    if (authorId) {
      newsData.authorId = authorId;
    }

    // Trim string fields
    if (typeof newsData.title === "string") newsData.title = newsData.title.trim();
    if (typeof newsData.description === "string") newsData.description = newsData.description.trim();

    const news = await News.create(newsData);
    return this.findNewsById(news.id);
  }

  async updateNews(id, updateData) {
    const news = await News.findOne({
      where: { id, is_deleted: false },
    });

    if (!news) throw new Error("News not found");

    if (typeof updateData.title === "string") updateData.title = updateData.title.trim();
    if (typeof updateData.description === "string") updateData.description = updateData.description.trim();

    await news.update(updateData);
    return this.findNewsById(id);
  }

  async deleteNews(id) {
    const news = await News.findOne({
      where: { id, is_deleted: false },
    });

    if (!news) throw new Error("News not found");

    await news.update({ is_deleted: true });
    return news;
  }

  async getNewsByCategory(category, page = 1, limit = 10) {
    return this.findAllNews(page, limit, category);
  }

  async getActiveNewsCount() {
    return News.count({
      where: {
        is_published: true,
        is_deleted: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });
  }
}

module.exports = new NewsService();