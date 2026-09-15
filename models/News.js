const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const News = sequelize.define(
  "News",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    authorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },

    image:       { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    title:       { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true } },
    description: { type: DataTypes.TEXT, allowNull: false },
    category:    { type: DataTypes.ENUM("Announcements", "Update", "Alert"), allowNull: false },

    expires_at:   { type: DataTypes.DATE, allowNull: false },
    is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_deleted:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: "news", timestamps: true }
);

module.exports = News;