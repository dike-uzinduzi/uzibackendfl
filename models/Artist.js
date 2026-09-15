const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const {
  DEFAULT_PROFILE_PIC,
  DEFAULT_COVER_PHOTO,
} = require("./constants/media");

const Artist = sequelize.define(
  "Artist",
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

    genreId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "genres", key: "id" },
      onDelete: "SET NULL",
    },

    name:      { type: DataTypes.STRING(200), allowNull: false },
    stageName: { type: DataTypes.STRING(200), allowNull: true },
    firstName: { type: DataTypes.STRING(100), allowNull: true },
    lastName:  { type: DataTypes.STRING(100), allowNull: true },

    bio: { type: DataTypes.TEXT, allowNull: true },

    profilePictureUrl: {
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
    // models/Artist.js — add to the field list
canCreateAlbums: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  comment: "Set by admin. When true, artist can create their own albums.",
},
  },
  {
    tableName: "artists",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["userId"], name: "artists_user_unique" },
    ],
  }

);

module.exports = Artist;