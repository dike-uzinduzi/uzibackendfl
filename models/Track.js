const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Track = sequelize.define(
  "Track",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    albumId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "albums", key: "id" },
      onDelete: "CASCADE",
    },

    title:      { type: DataTypes.STRING(255), allowNull: false },
    durationMs: { type: DataTypes.INTEGER, allowNull: false },
    trackNumber:{ type: DataTypes.INTEGER, allowNull: true },

    featuredArtists:  { type: DataTypes.STRING, allowNull: true },
    trackArt:         { type: DataTypes.STRING, allowNull: true },
    trackDescription: { type: DataTypes.TEXT,   allowNull: true },
    writer:           { type: DataTypes.STRING, allowNull: true },
    performedBy:      { type: DataTypes.STRING, allowNull: true },
    specialCredits:   { type: DataTypes.TEXT,   allowNull: true },
    backingVocals:    { type: DataTypes.STRING, allowNull: true },
    instrumentation:  { type: DataTypes.TEXT,   allowNull: true },
    releaseDate:      { type: DataTypes.DATE,   allowNull: true },
    producer:         { type: DataTypes.STRING, allowNull: true },
    masteringEngineer:{ type: DataTypes.STRING, allowNull: true },
    mixingEngineer:   { type: DataTypes.STRING, allowNull: true },

    likeCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isDeleted:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "tracks",
    timestamps: true,
    indexes: [{ fields: ["albumId"] }],
  }
);

module.exports = Track;