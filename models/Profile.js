const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const {
  DEFAULT_PROFILE_PIC,
  DEFAULT_COVER_PHOTO,
} = require("./constants/media");

const E164 = /^\+?[1-9]\d{1,14}$/;

const Profile = sequelize.define(
  "Profile",
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

    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },

    firstName: { type: DataTypes.STRING(100), allowNull: true },
    lastName:  { type: DataTypes.STRING(100), allowNull: true },
    nationalId:{ type: DataTypes.STRING(100), allowNull: true },

    phoneNumber: {
      type: DataTypes.STRING(17),
      allowNull: true,
      validate: {
        isE164(value) {
          if (value && !E164.test(value)) throw new Error("phoneNumber must be E.164 format");
        },
      },
    },

    whatsappNumber: {
      type: DataTypes.STRING(17),
      allowNull: true,
      validate: {
        isE164(value) {
          if (value && !E164.test(value)) throw new Error("whatsappNumber must be E.164 format");
        },
      },
    },

    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: true,
    },

    address:            { type: DataTypes.STRING(500), allowNull: true },
    countryOfResidence: { type: DataTypes.STRING(50),  allowNull: true },

    profilePic: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DEFAULT_PROFILE_PIC,
    },
    coverPhoto: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DEFAULT_COVER_PHOTO,
    },

    hasCustomProfilePic: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    hasCustomCoverPhoto: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
  },
  {
    tableName: "profiles",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId"], name: "profiles_user_unique" },
    ],
  }
);

module.exports = Profile;