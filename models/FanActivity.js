const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FanActivity = sequelize.define(
  "FanActivity",
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
      allowNull: true,
      references: { model: "artists", key: "id" },
      onDelete: "SET NULL",
    },

    type:     { type: DataTypes.STRING, allowNull: false },
    title:    { type: DataTypes.STRING, allowNull: false },
    message:  { type: DataTypes.TEXT,   allowNull: false },
    metadata: { type: DataTypes.JSONB,  allowNull: true },
    read:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "fan_activities",
    timestamps: true,
    indexes: [
      { fields: ["userId", "read"] },
      { fields: ["artistId"] },
    ],
  }
);

module.exports = FanActivity;