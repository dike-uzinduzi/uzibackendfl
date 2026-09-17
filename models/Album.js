const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { DEFAULT_ALBUM_COVER } = require("./constants/media");

const Album = sequelize.define(
  "Album",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    artistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "artists", key: "id" },
      onDelete: "CASCADE",
    },

    title:        { type: DataTypes.STRING(255), allowNull: false },
    release_date: { type: DataTypes.DATE, allowNull: false },

    albumType: {
      type: DataTypes.ENUM("album", "ep", "single", "mixtape", "playlist"),
      allowNull: false,
      defaultValue: "album",
    },

    cover_art: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DEFAULT_ALBUM_COVER,
    },
    hasCustomCoverArt: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
isDemo: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  comment: "Demo albums are the only ones demo accounts can interact with.",
},
    description: { type: DataTypes.TEXT, allowNull: true },

    track_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    duration:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
                   comment: "Total duration in seconds" },
    viewCount:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    copyright_info: { type: DataTypes.STRING, allowNull: true },
    publisher:      { type: DataTypes.STRING, allowNull: true },
    credits:        { type: DataTypes.TEXT,   allowNull: true },
    affiliation:    { type: DataTypes.STRING, allowNull: true },

    is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_featured:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_deleted:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    // Launch timing (startsAt / endsAt / status / tierThresholds) lives
    // on AlbumLaunch. Query it via `include: [{ model: AlbumLaunch, as: "launch" }]`.
  },
  {
    tableName: "albums",
    timestamps: true,
    indexes: [
      { fields: ["artistId"] },
      { fields: ["is_published", "is_deleted"] },
      { fields: ["release_date"] },
    ],
  }
);

module.exports = Album;