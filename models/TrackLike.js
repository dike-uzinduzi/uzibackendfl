const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TrackLike = sequelize.define(
  "TrackLike",
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
    trackId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "tracks", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "track_likes",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId", "trackId"], name: "track_likes_unique" },
    ],
  }
);

module.exports = TrackLike;