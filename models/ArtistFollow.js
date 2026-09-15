const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ArtistFollow = sequelize.define(
  "ArtistFollow",
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
    artistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "artists", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "artist_follows",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId", "artistId"], name: "artist_follows_unique" },
    ],
  }
);

module.exports = ArtistFollow;