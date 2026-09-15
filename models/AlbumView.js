const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AlbumView = sequelize.define(
  "AlbumView",
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
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
  },
  {
    tableName: "album_views",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["albumId", "userId"],
        name: "unique_album_user_view",
      },
    ],
  }
);

module.exports = AlbumView;