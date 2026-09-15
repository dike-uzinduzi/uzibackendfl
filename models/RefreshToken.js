const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RefreshToken = sequelize.define(
  "RefreshToken",
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

    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    familyId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },

    replacedByHash: { type: DataTypes.STRING(64), allowNull: true },
    revokedAt:      { type: DataTypes.DATE, allowNull: true },
    userAgent:      { type: DataTypes.STRING(500), allowNull: true },
    ip:             { type: DataTypes.STRING(45), allowNull: true },
    expiresAt:      { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: "refresh_tokens",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["tokenHash"], name: "refresh_tokens_hash_unique" },
      { fields: ["userId"] },
      { fields: ["familyId"] },
      { fields: ["expiresAt"] },
    ],
  }
);

module.exports = RefreshToken;