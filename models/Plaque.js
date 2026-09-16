const { DataTypes, Op } = require("sequelize");
const sequelize = require("../config/database");
const { DEFAULT_PLAQUE_IMAGE } = require("./constants/media");

const PLAQUE_TYPES = [
  "WOOD",
  "CRIMSON",
  "SAPPHIRE",
  "EMERALD",
  "SILVER",
  "GOLD",
];
const PLAQUE_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "ISSUED",
  "IN_PRODUCTION",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "COLLECTED",
  "CANCELLED",
];

const OWNER_TYPES = ["FAN", "CORPORATE"];

const Plaque = sequelize.define(
  "Plaque",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    serialNumber: {
      type: DataTypes.STRING(24),
      allowNull: false,
      validate: {
        is: {
        args: new RegExp(
        `^UZI-(${PLAQUE_TYPES.join("|")})-\\d{2}-[2-9A-HJKMNP-TV-Z]{6}$`
      ),}
      },
    },

    verificationCode: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },

    plaqueImageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DEFAULT_PLAQUE_IMAGE,
    },
    certificateUrl: { type: DataTypes.STRING, allowNull: true },
    qrCodeUrl:      { type: DataTypes.STRING, allowNull: true },

    // Blockchain anchor fields — nullable until minted
    chainId:         { type: DataTypes.INTEGER, allowNull: true },
    contractAddress: { type: DataTypes.STRING,  allowNull: true },
    tokenId:         { type: DataTypes.STRING,  allowNull: true },
    txHash:          { type: DataTypes.STRING,  allowNull: true },
    metadataUri:     { type: DataTypes.STRING,  allowNull: true },
    anchoredAt:      { type: DataTypes.DATE,    allowNull: true },

    plaqueType: {
      type: DataTypes.ENUM(...PLAQUE_TYPES),
      allowNull: false,
    },
plaqueCode: {
  type: DataTypes.VIRTUAL,
  get() {
    return this.getDataValue("serialNumber");
  },
},
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },

    ownerType: {
      type: DataTypes.ENUM(...OWNER_TYPES),
      allowNull: false,
    },

    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
    },

    ownerName: { type: DataTypes.STRING(150), allowNull: true },

    albumId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "albums", key: "id" },
      onDelete: "RESTRICT",
    },
    artistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "artists", key: "id" },
      onDelete: "RESTRICT",
    },
    paymentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "payments", key: "id" },
      onDelete: "RESTRICT",
      comment: "One plaque per successful payment",
    },

    status: {
      type: DataTypes.ENUM(...PLAQUE_STATUSES),
      allowNull: false,
      defaultValue: "PENDING_PAYMENT",
    },
// models/Plaque.js — add
isDemo: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  comment: "True if this plaque came from a demo payment.",
},
    shippingAddress: { type: DataTypes.TEXT, allowNull: true, defaultValue: "" },
    trackingNumber:  { type: DataTypes.STRING(100), allowNull: true },

    thankYouNoteOnly: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    minimumQualifiedAmount: {
      type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 51.0,
    },

    verificationHash: { type: DataTypes.TEXT, allowNull: true },
    isVerified:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    verifiedAt:       { type: DataTypes.DATE, allowNull: true },

    issuedAt:    { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    collectedAt: { type: DataTypes.DATE, allowNull: true },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },

    cancellationReason: { type: DataTypes.TEXT, allowNull: true },
    adminNotes:         { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "plaques",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["serialNumber"], name: "plaques_serial_unique" },
      { unique: true, fields: ["paymentId"],    name: "plaques_payment_unique" },
      { fields: ["ownerId"] },
      { fields: ["albumId"] },
      { fields: ["artistId"] },
      { fields: ["status"] },
      { fields: ["plaqueType"] },
      { fields: ["ownerType"] },
      { fields: ["createdAt"] },
      {
        fields: ["tokenId"],
        where: { tokenId: { [Op.ne]: null } },
        name: "plaques_token_idx",
      },
    ],
    hooks: {
      beforeValidate: (plaque) => {
        if (plaque.ownerType)    plaque.ownerType    = String(plaque.ownerType).toUpperCase();
        if (plaque.plaqueType)   plaque.plaqueType   = String(plaque.plaqueType).toUpperCase();
        if (plaque.status)       plaque.status       = String(plaque.status).toUpperCase();
        if (plaque.serialNumber) plaque.serialNumber = String(plaque.serialNumber).toUpperCase();
      },
    },
  }
);

Plaque.PLAQUE_TYPES    = PLAQUE_TYPES;
Plaque.PLAQUE_STATUSES = PLAQUE_STATUSES;
Plaque.OWNER_TYPES     = OWNER_TYPES;

module.exports = Plaque;