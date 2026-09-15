const { Artist, Genre, User, Album } = require("../models");
const { Op } = require("sequelize");

class ArtistService {

  // ─── Helper: consistent response shape ────────────────────
  _format(artist) {
    const plain = artist.get ? artist.get({ plain: true }) : artist;

    return {
      id: plain.id,
      name: plain.name,
      stageName: plain.stageName,
      firstName: plain.firstName,
      lastName: plain.lastName,
      bio: plain.bio,
      profilePictureUrl: plain.profilePictureUrl,
      coverPhoto: plain.coverPhoto,
      hasCustomProfilePic: plain.hasCustomProfilePic,
      hasCustomCoverPhoto: plain.hasCustomCoverPhoto,
      canCreateAlbums: plain.canCreateAlbums,
      // Joins (may be undefined depending on includes)
      genre: plain.Genre?.name || null,
      user: plain.User
        ? { userName: plain.User.userName, email: plain.User.email }
        : null,
      albums: Array.isArray(plain.albums) ? plain.albums : undefined,
    };
  }

  async findAllArtists() {
    const artists = await Artist.findAll({
      include: [
        { model: Genre, attributes: ["id", "name"], required: false },
        { model: User, attributes: ["id", "userName", "email"], required: false },
      ],
      order: [["name", "ASC"]],
    });

    return artists.map((a) => this._format(a));
  }

  async findArtistById(id) {
    const artist = await Artist.findByPk(id, {
      include: [
        { model: Genre, attributes: ["id", "name"], required: false },
        { model: User, attributes: ["id", "userName", "email"], required: false },
        {
          model: Album,
          as: "albums",                      // ← uses the alias from models/index.js
          attributes: [
            "id",
            "title",
            "cover_art",
            "description",
            "release_date",
            "track_count",
            "is_published",
            "is_featured",
            "createdAt",
          ],
          required: false,
          separate: true,                    // ← run as a second query, respects order
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!artist) throw new Error("Artist not found");
    return this._format(artist);
  }

  async createArtist(artistData) {
    const payload = { ...artistData };

    payload.name = payload.name?.trim();
    payload.stageName = payload.stageName?.trim();
    payload.firstName = payload.firstName?.trim();
    payload.lastName = payload.lastName?.trim();

    if (!payload.name) throw new Error("Artist name is required");
    if (!payload.stageName) payload.stageName = payload.name;

    const existing = await Artist.findOne({
      where: { stageName: { [Op.iLike]: payload.stageName } },
    });
    if (existing) throw new Error("Artist with this stage name already exists");

    const artist = await Artist.create(payload);
    return artist;
  }

  async updateArtist(id, updateData) {
    const artist = await Artist.findByPk(id);
    if (!artist) throw new Error("Artist not found");

    const payload = { ...updateData };

    if (typeof payload.name === "string")      payload.name = payload.name.trim();
    if (typeof payload.stageName === "string") payload.stageName = payload.stageName.trim();
    if (typeof payload.firstName === "string") payload.firstName = payload.firstName.trim();
    if (typeof payload.lastName === "string")  payload.lastName = payload.lastName.trim();

    const nextName = payload.name ?? artist.name;
    const nextStageName = payload.stageName || artist.stageName || nextName;

    if (!nextName) throw new Error("Artist name is required");

    const existing = await Artist.findOne({
      where: {
        id: { [Op.ne]: id },
        stageName: { [Op.iLike]: nextStageName },
      },
    });
    if (existing) throw new Error("Artist with this stage name already exists");

    payload.stageName = nextStageName;
    await artist.update(payload);
    return this.findArtistById(id);
  }

  async deleteArtist(id) {
    const artist = await Artist.findByPk(id);
    if (!artist) throw new Error("Artist not found");
    await artist.destroy();
    return artist;
  }
}

module.exports = new ArtistService();