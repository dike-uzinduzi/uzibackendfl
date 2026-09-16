const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PlaqueTier = sequelize.define(
  "PlaqueTier",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    slug: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: "SILVER, GOLD, SAPPHIRE, EMERALD, CRIMSON",
    },

    displayName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    minAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Lower = lower tier",
    },

    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "R2 key or full URL, e.g. plaques/gold.png",
    },

    benefits: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: "Array of strings shown on the album detail screen",
    },

    freeShowDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "plaque_tiers",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["slug"] },
      { fields: ["order"] },
      { fields: ["isActive"] },
    ],
  }
);

module.exports = PlaqueTier;