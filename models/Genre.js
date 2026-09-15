const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Genre = sequelize.define(
  "Genre",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.STRING(120), allowNull: true },
  },
  {
    tableName: "genres",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["name"], name: "genres_name_unique" },
    ],
  }
);

module.exports = Genre;