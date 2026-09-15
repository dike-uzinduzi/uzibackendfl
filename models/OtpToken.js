const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");

const OTP_PURPOSES = [
  "email_verification",
  "password_reset",
  "admin_creation",
  "delete_account",
];

const OtpToken = sequelize.define(
  "OtpToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue("email", String(value).toLowerCase().trim());
      },
    },

    purpose: {
      type: DataTypes.ENUM(...OTP_PURPOSES),
      allowNull: false,
    },

    codeHash: { type: DataTypes.STRING, allowNull: false },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    consumedAt: { type: DataTypes.DATE, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: "otp_tokens",
    timestamps: true,
    indexes: [
      { fields: ["email", "purpose"] },
      { fields: ["expiresAt"] },
    ],
  }
);

OtpToken.hashCode   = (code) => bcrypt.hash(String(code), 10);
OtpToken.verifyCode = (code, hash) => bcrypt.compare(String(code), hash);
OtpToken.PURPOSES   = OTP_PURPOSES;

module.exports = OtpToken;