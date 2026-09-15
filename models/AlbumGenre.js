const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AlbumGenre = sequelize.define(
  "AlbumGenre",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    albumId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "albums", key: "id" },
      onDelete: "CASCADE",
    },
    genreId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "genres", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "album_genres",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["albumId", "genreId"], name: "album_genres_unique" },
    ],
  }
);

module.exports = AlbumGenre;