const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AlbumLike = sequelize.define(
  "AlbumLike",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },

    albumId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "albums", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "album_likes",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "albumId"],
        name: "album_likes_unique",
      },
      { fields: ["albumId"] },
      { fields: ["userId"] },
    ],
  }
);

module.exports = AlbumLike;