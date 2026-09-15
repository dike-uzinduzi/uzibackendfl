const albumService = require("../services/albumService");
const { Artist, Genre, Album } = require("../models");

class AlbumController {
  constructor() {
    this.getAllAlbums = this.getAllAlbums.bind(this);
    this.getAlbumById = this.getAlbumById.bind(this);
    this.createAlbum = this.createAlbum.bind(this);
    this.updateAlbum = this.updateAlbum.bind(this);
    this.deleteAlbum = this.deleteAlbum.bind(this);
    this.getNewestAlbums = this.getNewestAlbums.bind(this);
    this.getFeaturedAlbum = this.getFeaturedAlbum.bind(this);
    this.getDashboardStats = this.getDashboardStats.bind(this);
    this.addPlaque = this.addPlaque.bind(this);
    this.updatePlaque = this.updatePlaque.bind(this);
    this.deletePlaque = this.deletePlaque.bind(this);
    this.getMyAlbums = this.getMyAlbums.bind(this);
  }

 async loadAlbumWithGenres(id) {
  return Album.findByPk(id, {
    include: [
      {
        model: Genre,
        as: "Genres",
        through: { attributes: [] },
      },
    ],
  });
}

  async syncAlbumGenres(albumId, genreIds) {
    if (!Array.isArray(genreIds)) return;

    const albumInstance = await Album.findByPk(albumId);
    if (!albumInstance) {
      throw new Error("Album not found");
    }

    await albumInstance.setGenres(genreIds);
  }

  normalizeCommaList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .filter(
        (item, index, arr) =>
          arr.findIndex((x) => x.toLowerCase() === item.toLowerCase()) === index
      );
  }

  async resolveGenreIdsFromBody(body) {
    if (Array.isArray(body.genreIds) && body.genreIds.length > 0) {
      return body.genreIds;
    }

    const legacyId = body.genreId || body.genre;
    if (legacyId) {
      return [legacyId];
    }

    if (body.genres) {
      const names = this.normalizeCommaList(body.genres);
      if (!names.length) return [];

      const ids = [];

      for (const name of names) {
        let genre = await Genre.findOne({
          where: { name },
        });

        if (!genre) {
          genre = await Genre.create({ name });
        }

        ids.push(genre.id);
      }

      return ids;
    }

    return [];
  }

async getAllAlbums(req, res) {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    const filter = { is_published: true };
    if (req.query.artist) filter.artistId = req.query.artist;

    const genreId = req.query.genre || null;

    const result = await albumService.findAllAlbums(filter, page, limit, { genreId });

    return res.status(200).json({
      success: true,
      data: result.albums,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error("getAllAlbums error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async getAlbumById(req, res) {
  try {
    const album = await albumService.findAlbumById(req.params.id);
    return res.status(200).json({ success: true, data: album });
  } catch (error) {
    console.error("getAlbumById error:", error);
    const statusCode = error.message?.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
}

async createAlbum(req, res) {
  try {
    const payload = { ...req.body };
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);

    if (isAdmin) {
      // Admin can specify any artistId
      if (payload.artist && !payload.artistId) {
        payload.artistId = payload.artist;
      }
      if (!payload.artistId) {
        return res.status(400).json({
          success: false,
          message: "artistId is required when an admin creates an album",
        });
      }
    } else {
      // Artist must be creating for themselves
      const artist = await Artist.findOne({
        where: { userId: req.user.id },
        attributes: ["id", "canCreateAlbums"],
      });
      if (!artist) {
        return res.status(403).json({ success: false, message: "Only artists can create albums" });
      }
      if (!artist.canCreateAlbums) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to create albums yet. Contact an admin.",
        });
      }
      payload.artistId = artist.id;
    }

    const genreIds = await this.resolveGenreIdsFromBody(payload);
    const {
      genreIds: _genreIds,
      genres: _genreNames,
      genreId: _genreId,
      genre: _genre,
      artist: _artist,
      ...albumData
    } = payload;

    const album = await albumService.createAlbum(albumData);

    if (genreIds.length > 0) {
      await this.syncAlbumGenres(album.id, genreIds);
    }

    const fullAlbum = await this.loadAlbumWithGenres(album.id);

    return res.status(201).json({
      success: true,
      message: "Album created successfully",
      album: fullAlbum,
    });
  } catch (error) {
    console.error("createAlbum controller error:", error);
    const statusCode = error.message?.toLowerCase().includes("required") ||
                       error.message?.toLowerCase().includes("invalid") ||
                       error.message?.toLowerCase().includes("exists")
      ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
}

 async updateAlbum(req, res) {
  try {
    const ok = await this._assertAlbumOwnership(req, res, req.params.id);
    if (!ok) return;

    const payload = { ...req.body };

    if (payload.artist && !payload.artistId) {
      payload.artistId = payload.artist;
    }

    // Artists can't reassign an album to another artist
    if (!["admin", "super_admin"].includes(req.user.role)) {
      delete payload.artistId;
      delete payload.artist;
    }

    const genreIds = await this.resolveGenreIdsFromBody(payload);

    const {
      genreIds: _genreIds,
      genres: _genreNames,
      genreId: _genreId,
      genre: _genre,
      ...albumData
    } = payload;

    await albumService.updateAlbum(req.params.id, albumData);

    if (Array.isArray(genreIds)) {
      await this.syncAlbumGenres(req.params.id, genreIds);
    }

    const fullAlbum = await this.loadAlbumWithGenres(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Album updated successfully",
      album: fullAlbum,
    });
  } catch (error) {
    console.error("updateAlbum error:", error);

    const statusCode = error.message?.toLowerCase().includes("not found")
      ? 404
      : error.message?.toLowerCase().includes("required") ||
        error.message?.toLowerCase().includes("invalid")
        ? 400
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Error updating album",
    });
  }
}

  async deleteAlbum(req, res) {
  try {
    const ok = await this._assertAlbumOwnership(req, res, req.params.id);
    if (!ok) return;

    await albumService.deleteAlbum(req.params.id);
    return res.status(200).json({ success: true, message: "Album deleted successfully" });
  } catch (error) {
    console.error("deleteAlbum error:", error);
    const statusCode = error.message?.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
}
//helper method to check if the current user is allowed to modify the album
async _assertAlbumOwnership(req, res, albumId) {
  const isAdmin = ["admin", "super_admin"].includes(req.user.role);
  if (isAdmin) return true;

  const artist = await Artist.findOne({
    where: { userId: req.user.id },
    attributes: ["id"],
  });
  if (!artist) {
    res.status(403).json({ success: false, message: "Only artists can manage albums" });
    return false;
  }

  const album = await Album.findByPk(albumId, { attributes: ["artistId"] });
  if (!album) {
    res.status(404).json({ success: false, message: "Album not found" });
    return false;
  }

  if (album.artistId !== artist.id) {
    res.status(403).json({ success: false, message: "You can only manage your own albums" });
    return false;
  }

  return true;
}
 
async getNewestAlbums(req, res) {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 5;
    const albums = await albumService.getNewestAlbums(limit);
    return res.status(200).json({ success: true, data: albums, count: albums.length });
  } catch (error) {
    console.error("getNewestAlbums error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async getFeaturedAlbum(req, res) {
  try {
    const album = await Album.findOne({
      where: { is_featured: true, is_deleted: false },
      include: [
        {
          model: Artist,
          as: "artist",               // ← ADD
          attributes: ["id", "name", "stageName", "profilePictureUrl"],
          required: false,
        },
        {
          model: Genre,
          as: "Genres",
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

if (!album) {
  return res.status(200).json({
    success: true,
    data: null,
    message: "No featured album found",
  });
}

return res.status(200).json({ success: true, data: album });

  } catch (error) {
    console.error("getFeaturedAlbum error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving featured album",
      error: error.message,
    });
  }
}

  async getDashboardStats(req, res) {
    try {
      const stats = await albumService.getDashboardStats();

      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error("getDashboardStats error:", error);

      return res.status(500).json({
        success: false,
        message: "Error retrieving dashboard stats",
        error: error.message,
      });
    }
  }

  async addPlaque(req, res) {
    try {
      const album = await albumService.addPlaque(req.params.id, req.body);

      return res.status(200).json({
        success: true,
        message: "Plaque added successfully",
        album,
      });
    } catch (error) {
      console.error("addPlaque error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Error adding plaque",
      });
    }
  }

  async updatePlaque(req, res) {
    try {
      const index = Number.parseInt(req.params.plaqueId, 10);

      if (Number.isNaN(index)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plaque index",
        });
      }

      const album = await albumService.updatePlaque(
        req.params.id,
        index,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Plaque updated successfully",
        album,
      });
    } catch (error) {
      console.error("updatePlaque error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Error updating plaque",
      });
    }
  }

  async deletePlaque(req, res) {
    try {
      const index = Number.parseInt(req.params.plaqueId, 10);

      if (Number.isNaN(index)) {
        return res.status(400).json({
          success: false,
          message: "Invalid plaque index",
        });
      }

      const album = await albumService.deletePlaque(req.params.id, index);

      return res.status(200).json({
        success: true,
        message: "Plaque deleted successfully",
        album,
      });
    } catch (error) {
      console.error("deletePlaque error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Error deleting plaque",
      });
    }
  }

  async getMyAlbums(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const artist = await Artist.findOne({
        where: { userId },
      });

  if (!artist) {
  return res.status(200).json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  });
}

const page = Number.parseInt(req.query.page, 10) || 1;
const limit = Number.parseInt(req.query.limit, 10) || 10;

const result = await albumService.findAlbumsByArtist(artist.id, page, limit);

return res.status(200).json({
  success: true,
  data: result.albums,
  pagination: {
    page: result.page,
    limit: result.limit,
    total: result.total,
    pages: Math.ceil(result.total / result.limit),
  },
});
    } catch (error) {
      console.error("getMyAlbums error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Error retrieving your albums",
      });
    }
  }
}

module.exports = new AlbumController();