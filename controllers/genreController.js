const genreService = require("../services/genreService");

class GenreController {
  async getAllGenres(req, res) {
    try {
      const genres = await genreService.findAllGenres();
      res.json({ success: true, data: genres, count: genres.length });
    } catch (error) {
      console.error("getAllGenres error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getGenreById(req, res) {
    try {
      const genre = await genreService.findGenreById(req.params.id);
      res.json({ success: true, data: genre });
    } catch (error) {
      console.error("getGenreById error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async createGenre(req, res) {
    try {
      const genre = await genreService.createGenre(req.body);
      res.status(201).json({
        success: true,
        message: "Genre created successfully",
        data: genre,
      });
    } catch (error) {
      console.error("createGenre error:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ success: false, message: "Genre already exists" });
      }

      const status = error.message?.toLowerCase().includes("required") ||
                     error.message?.toLowerCase().includes("exists")
        ? 400 : 500;

      res.status(status).json({ success: false, message: error.message });
    }
  }

  async updateGenre(req, res) {
    try {
      const genre = await genreService.updateGenre(req.params.id, req.body);
      res.json({
        success: true,
        message: "Genre updated successfully",
        data: genre,
      });
    } catch (error) {
      console.error("updateGenre error:", error);
      const status = error.message?.toLowerCase().includes("not found")
        ? 404
        : error.message?.toLowerCase().includes("exists") ||
          error.message?.toLowerCase().includes("empty")
          ? 400 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async deleteGenre(req, res) {
    try {
      await genreService.deleteGenre(req.params.id);
      res.json({ success: true, message: "Genre deleted successfully" });
    } catch (error) {
      console.error("deleteGenre error:", error);
      const status = error.message?.toLowerCase().includes("not found")
        ? 404
        : error.message?.toLowerCase().includes("in use")
          ? 409 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }
}

module.exports = new GenreController();