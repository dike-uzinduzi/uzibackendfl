const { Album, Artist, Genre, Track, AlbumLaunch } = require("../models");
const { Op } = require("sequelize");

class AlbumService {

  // ─── Helper: format album for API response ────────────────
  _format(a) {
    const plain = a.get ? a.get({ plain: true }) : a;

    const genresArr = Array.isArray(plain.Genres) ? plain.Genres : [];
    const genreNames = genresArr.map((g) => g.name);

    // Artist may come through the alias (as: "artist") or as the raw object
    const artistObj = plain.artist || plain.Artist || null;

    return {
      ...plain,
      artist: artistObj
        ? {
            id: artistObj.id,
            name: artistObj.stageName || artistObj.name,
            profilePictureUrl: artistObj.profilePictureUrl || null,
          }
        : null,
      genre: genreNames.length ? genreNames.join(", ") : null,
      genres: genresArr,
    };
  }

  async findAlbumsByArtist(artistId, page = 1, limit = 10) {
    try {
      return await this.findAllAlbums({ artistId }, page, limit);
    } catch (error) {
      console.error("findAlbumsByArtist error:", error);
      throw new Error("Failed to fetch artist albums");
    }
  }

  async findAllAlbums(filter = {}, page = 1, limit = 10, opts = {}) {
    try {
      const offset = (page - 1) * limit;

      const whereClause = {
        ...filter,
        is_deleted: false,
      };

      const include = [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "name", "stageName", "profilePictureUrl"],
        },
        {
          model: Genre,
          as: "Genres",
          attributes: ["id", "name"],
          through: { attributes: [] },
          ...(opts.genreId ? { where: { id: opts.genreId } } : {}),
          required: !!opts.genreId,
        },
        {
          model: AlbumLaunch,
          as: "launch",
          attributes: ["id", "startsAt", "endsAt", "status", "tierThresholds"],
          required: false,
        },
      ];

      const { count, rows } = await Album.findAndCountAll({
        where: whereClause,
        include,
        distinct: true,
        order: [["createdAt", "DESC"]],
        offset,
        limit: parseInt(limit),
      });

      return {
        albums: rows.map((a) => this._format(a)),
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      };
    } catch (error) {
      console.error("findAllAlbums error:", error);
      throw new Error("Failed to fetch albums");
    }
  }

  async findAlbumById(id) {
    try {
      const album = await Album.findOne({
        where: { id },
        include: [
          {
            model: Artist,
            as: "artist",
            attributes: ["id", "name", "stageName", "profilePictureUrl", "bio"],
          },
          {
            model: Genre,
            as: "Genres",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
          {
            model: Track,
            where: { isDeleted: false },
            required: false,
            attributes: [
              "id", "title", "durationMs", "trackNumber",
              "featuredArtists", "trackArt", "producer",
              "writer", "performedBy", "releaseDate", "likeCount",
            ],
          },
          {
            model: AlbumLaunch,
            as: "launch",
            required: false,
          },
        ],
      });

      if (!album) throw new Error("Album not found");

      const formatted = this._format(album);

      // Sort tracks by trackNumber
      if (Array.isArray(formatted.Tracks)) {
        formatted.Tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
      }

      return formatted;
    } catch (error) {
      console.error("findAlbumById error:", error);
      throw new Error("Failed to fetch album");
    }
  }

  async createAlbum(data) {
    try {
      const album = await Album.create(data);
      return await this.findAlbumById(album.id);
    } catch (error) {
      console.error("createAlbum error:", error);
      throw new Error(`Failed to create album: ${error.message}`);
    }
  }

  async updateAlbum(id, data) {
    try {
      // NOTE: expires_at was removed from Album — launch timing lives on AlbumLaunch.
      // Do not set it here. Launch dates are updated via /api/albums/:id/launch.

      const album = await Album.findByPk(id);
      if (!album) throw new Error("Album not found");

      await album.update(data);
      return await this.findAlbumById(id);
    } catch (error) {
      console.error("updateAlbum error:", error);
      throw new Error(`Failed to update album: ${error.message}`);
    }
  }

  async deleteAlbum(id) {
    try {
      const album = await Album.findByPk(id);
      if (!album) throw new Error("Album not found");
      await album.update({ is_deleted: true });
      return album;
    } catch (error) {
      console.error("deleteAlbum error:", error);
      throw new Error(`Failed to delete album: ${error.message}`);
    }
  }

  async getNewestAlbums(limit = 5) {
    try {
      const albums = await Album.findAll({
        where: { is_deleted: false, is_published: true },
        include: [
          {
            model: Artist,
            as: "artist",
            attributes: ["id", "name", "stageName", "profilePictureUrl"],
          },
          {
            model: Genre,
            as: "Genres",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
      });

      return albums.map((a) => this._format(a));
    } catch (error) {
      console.error("getNewestAlbums error:", error);
      throw new Error("Failed to fetch newest albums");
    }
  }

  async getDashboardStats() {
    try {
      const total     = await Album.count({ where: { is_deleted: false } });
      const published = await Album.count({ where: { is_deleted: false, is_published: true } });
      return { total, published };
    } catch (error) {
      console.error("getDashboardStats error:", error);
      throw new Error("Failed to fetch dashboard stats");
    }
  }

  async getFeaturedAlbum() {
    try {
      const album = await Album.findOne({
        where: { is_deleted: false, is_published: true, is_featured: true },
        include: [
          {
            model: Artist,
            as: "artist",
            attributes: ["id", "name", "stageName", "profilePictureUrl"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      if (!album) return null;
      return this._format(album);
    } catch (error) {
      console.error("getFeaturedAlbum error:", error);
      throw new Error("Failed to fetch featured album");
    }
  }

  // ─── Plaque array sub-resources ────────────────────────────
  // Kept for backwards compat. The dedicated Plaque model is now the
  // authoritative record; this array is legacy.

  async addPlaque(id, plaqueData) {
    try {
      const album = await Album.findByPk(id);
      if (!album) throw new Error("Album not found");
      const newPlaques = [...(album.plaqueArray || []), plaqueData];
      await album.update({ plaqueArray: newPlaques });
      return album;
    } catch (error) {
      console.error("addPlaque error:", error);
      throw new Error(`Failed to add plaque: ${error.message}`);
    }
  }

  async updatePlaque(id, index, plaqueData) {
    try {
      const album = await Album.findByPk(id);
      if (!album) throw new Error("Album not found");
      const plaques = album.plaqueArray ? [...album.plaqueArray] : [];
      if (!plaques[index]) throw new Error("Plaque not found");
      plaques[index] = { ...plaques[index], ...plaqueData };
      await album.update({ plaqueArray: plaques });
      return album;
    } catch (error) {
      console.error("updatePlaque error:", error);
      throw new Error(`Failed to update plaque: ${error.message}`);
    }
  }

  async deletePlaque(id, index) {
    try {
      const album = await Album.findByPk(id);
      if (!album) throw new Error("Album not found");
      const plaques = album.plaqueArray ? [...album.plaqueArray] : [];
      if (!plaques[index]) throw new Error("Plaque not found");
      plaques.splice(index, 1);
      await album.update({ plaqueArray: plaques });
      return album;
    } catch (error) {
      console.error("deletePlaque error:", error);
      throw new Error(`Failed to delete plaque: ${error.message}`);
    }
  }
}

module.exports = new AlbumService();