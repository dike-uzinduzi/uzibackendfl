const { Genre, Artist, AlbumGenre } = require("../models");
const { Op } = require("sequelize");

class GenreService {

  async findAllGenres() {
    return Genre.findAll({ order: [["name", "ASC"]] });
  }

  async findGenreById(id) {
    const genre = await Genre.findByPk(id);
    if (!genre) throw new Error("Genre not found");
    return genre;
  }

  async createGenre(genreData) {
    const name = genreData.name?.trim();
    if (!name) throw new Error("Genre name is required");

    const existing = await Genre.findOne({ where: { name } });
    if (existing) throw new Error(`Genre "${name}" already exists`);

    return Genre.create({ ...genreData, name });
  }

  async updateGenre(id, updateData) {
    const genre = await Genre.findByPk(id);
    if (!genre) throw new Error("Genre not found");

    if (typeof updateData.name === "string") {
      const name = updateData.name.trim();
      if (!name) throw new Error("Genre name cannot be empty");

      const existing = await Genre.findOne({
        where: { name, id: { [Op.ne]: id } },
      });
      if (existing) throw new Error(`Genre "${name}" already exists`);

      updateData = { ...updateData, name };
    }

    await genre.update(updateData);
    return genre;
  }

  async deleteGenre(id) {
    const genre = await Genre.findByPk(id);
    if (!genre) throw new Error("Genre not found");

    const artistCount = await Artist.count({ where: { genreId: id } });
    const albumLinkCount = await AlbumGenre.count({ where: { genreId: id } });

    if (artistCount > 0 || albumLinkCount > 0) {
      throw new Error(
        `Cannot delete genre "${genre.name}" — in use by ${artistCount} artist(s) and ${albumLinkCount} album link(s)`
      );
    }

    await genre.destroy();
    return genre;
  }
}

module.exports = new GenreService();