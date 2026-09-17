const { DataTypes, Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");
const { ROLES } = require("./constants/roles");

const BCRYPT_ROUNDS = 12;
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // unique enforced by index below — no inline `unique: true`
    userName: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        len: { args: [3, 30], msg: "Username must be 3–30 characters" },
        is: {
          args: /^[a-zA-Z0-9_.]+$/,
          msg: "Username may only contain letters, numbers, dot, and underscore",
        },
      },
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue("email", String(value).toLowerCase().trim());
      },
    },

    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: "fan",
    },
// models/User.js — add to the field list
isDemoAccount: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  comment: "Demo accounts bypass payment. Never grant to real users.",
},
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isSuspended: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
},

    oauthProvider:   { type: DataTypes.STRING(50), allowNull: true },
    oauthProviderId: { type: DataTypes.STRING, allowNull: true },
    oauthNeedsCompletion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    fcmTokens: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },

    passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
    lastLoginAt:       { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["email"],    name: "users_email_unique" },
      { unique: true, fields: ["userName"], name: "users_username_unique" },
      {
        unique: true,
        fields: ["oauthProvider", "oauthProviderId"],
        where: { oauthProvider: { [Op.ne]: null } },
        name: "users_oauth_link_unique",
      },
    ],
  }
);

const hashPassword = async (user) => {
  if (!user.changed("password") || !user.password) return;
  if (BCRYPT_HASH_RE.test(user.password)) return;
  user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date(Date.now() - 1000);
};

User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);

User.prototype.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

User.initializeSuperAdmin = async function () {
  const existing = await User.findOne({ where: { role: "super_admin" } });
  if (existing) return existing;

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_DEFAULT_PASSWORD;

  if (!email || !password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SUPER_ADMIN_EMAIL and SUPER_ADMIN_DEFAULT_PASSWORD must be set in production"
      );
    }
    console.warn("⚠️  Skipping super admin seed — env vars not set.");
    return null;
  }

  const admin = await User.create({
    userName: "superadmin",
    email,
    password,
    role: "super_admin",
    isEmailVerified: true,
  });

  console.log("✅ Super admin created:", email);
  return admin;
};

module.exports = User;