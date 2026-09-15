const artistService = require("../services/artistService");
const { Artist, Genre, User } = require("../models");

class ArtistController {

  // ─── Public reads ─────────────────────────────────────────

  async getAllArtists(req, res) {
    try {
      const artists = await artistService.findAllArtists();
      return res.status(200).json({
        success: true,
        data: artists,
        count: artists.length,
      });
    } catch (error) {
      console.error("getAllArtists error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getArtistById(req, res) {
    try {
      const artist = await artistService.findArtistById(req.params.id);
      return res.status(200).json({ success: true, data: artist });
    } catch (error) {
      console.error("getArtistById error:", error);
      const statusCode = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  async getMyArtist(req, res) {
    try {
      const artist = await Artist.findOne({
        where: { userId: req.user.id },
        include: [
          { model: Genre, attributes: ["id", "name"], required: false },
          { model: User, attributes: ["id", "userName", "email"], required: false },
        ],
      });

      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "No artist profile exists for this account",
        });
      }

      return res.status(200).json({ success: true, data: artist });
    } catch (error) {
      console.error("getMyArtist error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── Admin create ─────────────────────────────────────────

  async createArtist(req, res) {
    try {
      const payload = { ...req.body };

      // Legacy field aliases
      if (payload.user && !payload.userId) payload.userId = payload.user;
      if (payload.genre && !payload.genreId) payload.genreId = payload.genre;

      // Strip media fields — go through the media pipeline
      delete payload.profilePictureUrl;
      delete payload.coverPhoto;
      delete payload.id;

      if (!payload.userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required to create an artist profile",
        });
      }

      // Verify the target user exists and has the artist role
      const user = await User.findByPk(payload.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (user.role !== "artist") {
        return res.status(400).json({
          success: false,
          message: `User must have role 'artist' (got '${user.role}')`,
        });
      }

      // Verify no existing artist for this user
      const existing = await Artist.findOne({ where: { userId: payload.userId } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "This user already has an artist profile",
        });
      }

      const artist = await artistService.createArtist(payload);
      return res.status(201).json({
        success: true,
        message: "Artist created successfully",
        data: artist,
      });
    } catch (error) {
      console.error("createArtist error:", error);
      const statusCode =
        error.message?.toLowerCase().includes("required") ||
        error.message?.toLowerCase().includes("invalid") ||
        error.message?.toLowerCase().includes("exists")
          ? 400 : 500;
      return res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  // ─── Update: admin or self ────────────────────────────────

  async updateArtist(req, res) {
    try {
      const { id } = req.params;
      const isAdmin = ["admin", "super_admin"].includes(req.user.role);

      // Non-admins can only edit their own artist record
      if (!isAdmin) {
        const target = await Artist.findByPk(id, { attributes: ["userId"] });
        if (!target) {
          return res.status(404).json({ success: false, message: "Artist not found" });
        }
        if (target.userId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "You can only edit your own artist profile",
          });
        }
      }

      const payload = { ...req.body };

      // Legacy field aliases
      if (payload.user && !payload.userId) payload.userId = payload.user;
      if (payload.genre && !payload.genreId) payload.genreId = payload.genre;

      // Nobody changes these via this endpoint
      delete payload.id;
      delete payload.userId;            // can't reassign artist to another user
      delete payload.canCreateAlbums;   // admin-granted only
      delete payload.profilePictureUrl; // media pipeline only
      delete payload.coverPhoto;        // media pipeline only

      const artist = await artistService.updateArtist(id, payload);
      return res.status(200).json({
        success: true,
        message: "Artist updated successfully",
        data: artist,
      });
    } catch (error) {
      console.error("updateArtist error:", error);
      const statusCode = error.message?.toLowerCase().includes("not found")
        ? 404
        : error.message?.toLowerCase().includes("required") ||
          error.message?.toLowerCase().includes("invalid")
          ? 400 : 500;
      return res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  // ─── Admin delete ─────────────────────────────────────────

  async deleteArtist(req, res) {
    try {
      await artistService.deleteArtist(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Artist deleted successfully",
      });
    } catch (error) {
      console.error("deleteArtist error:", error);
      const statusCode = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      return res.status(statusCode).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ArtistController();