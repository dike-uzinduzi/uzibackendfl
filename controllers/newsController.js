const newsService = require("../services/newsService");

class NewsController {

  async getAllNews(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const category = req.query.category || null;

      const result = await newsService.findAllNews(page, limit, category);

      res.json({
        success: true,
        data: result.news,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("getAllNews error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getNewsByCategory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const { category } = req.params;

      const result = await newsService.getNewsByCategory(category, page, limit);

      res.json({
        success: true,
        data: result.news,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("getNewsByCategory error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getNewsById(req, res) {
    try {
      const news = await newsService.findNewsById(req.params.id);
      res.json({ success: true, data: news });
    } catch (error) {
      console.error("getNewsById error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async createNews(req, res) {
    try {
      const news = await newsService.createNews(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: "News created successfully",
        data: news,
      });
    } catch (error) {
      console.error("createNews error:", error);
      const status = error.message?.toLowerCase().includes("required")
        ? 400 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async updateNews(req, res) {
    try {
      const news = await newsService.updateNews(req.params.id, req.body);
      res.json({
        success: true,
        message: "News updated successfully",
        data: news,
      });
    } catch (error) {
      console.error("updateNews error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async deleteNews(req, res) {
    try {
      await newsService.deleteNews(req.params.id);
      res.json({ success: true, message: "News deleted successfully" });
    } catch (error) {
      console.error("deleteNews error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async getNewsStats(req, res) {
    try {
      const activeCount = await newsService.getActiveNewsCount();
      res.json({
        success: true,
        data: { activeNews: activeCount },
      });
    } catch (error) {
      console.error("getNewsStats error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new NewsController();