const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CorporateSupport = sequelize.define(
  "CorporateSupport",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    corporateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "corporate_profiles", key: "id" },
      onDelete: "CASCADE",
    },
    artistId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "artists", key: "id" },
      onDelete: "SET NULL",
      comment: "Null if pooled CSR support",
    },

    campaignType: {
      type: DataTypes.ENUM(
        "album_launch", "plaque_support", "matched_funding", "csr_pool"
      ),
      allowNull: false,
    },

    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

    status: {
      type: DataTypes.ENUM("pending", "active", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },

    reference: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "corporate_supports",
    timestamps: true,
    indexes: [{ fields: ["corporateId"] }, { fields: ["artistId"] }],
  }
);

module.exports = CorporateSupport;