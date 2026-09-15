const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const {
  DEFAULT_CORPORATE_LOGO,
  DEFAULT_COVER_PHOTO,
} = require("./constants/media");

const CorporateProfile = sequelize.define(
  "CorporateProfile",
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

    companyName: { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    industry:    { type: DataTypes.STRING, allowNull: true, defaultValue: "" },
    csrFocus:    { type: DataTypes.STRING, allowNull: true },
    monthlyBudget: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    taxId: { type: DataTypes.STRING, allowNull: true },

    websiteUrl:    { type: DataTypes.STRING, allowNull: true, validate: { isUrl: true } },
    officialEmail: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
    companyBio:    { type: DataTypes.TEXT,   allowNull: true },
    corpAddress:   { type: DataTypes.TEXT,   allowNull: true },

    logoUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DEFAULT_CORPORATE_LOGO,
    },
    coverPhoto: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DEFAULT_COVER_PHOTO,
    },
    hasCustomLogo:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hasCustomCoverPhoto: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    socialLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { facebook: "", twitter: "", tiktok: "", linkedin: "", instagram: "" },
    },

    isActive:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    verifiedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "corporate_profiles",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId"], name: "corp_profiles_user_unique" },
    ],
  }
);

module.exports = CorporateProfile;