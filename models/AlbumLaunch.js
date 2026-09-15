// models/AlbumLaunch.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LAUNCH_STATUSES = ["scheduled", "active", "ended", "cancelled"];

const AlbumLaunch = sequelize.define(
  "AlbumLaunch",
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

    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt:   { type: DataTypes.DATE, allowNull: false },

    physicalLaunchAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Artist's physical launch date. Virtual window is typically derived from this.",
    },

    status: {
      type: DataTypes.ENUM(...LAUNCH_STATUSES),
      allowNull: false,
      defaultValue: "scheduled",
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
      comment: "Admin who scheduled the launch",
    },

    tierThresholds: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Snapshot: [{ tier: 'SILVER', minAmount: 51 }, ...]",
    },
  },
  {
    tableName: "album_launches",
    timestamps: true,
    indexes: [
      { fields: ["albumId"] },
      { fields: ["status"] },
      { fields: ["startsAt"] },
      { fields: ["endsAt"] },
    ],
  }
);

AlbumLaunch.STATUSES = LAUNCH_STATUSES;
module.exports = AlbumLaunch;