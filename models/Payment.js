const { DataTypes, Op } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    referenceNumber:  { type: DataTypes.STRING, allowNull: false },
    ecocashReference: { type: DataTypes.STRING, allowNull: true },

    status: {
      type: DataTypes.ENUM(
        "PENDING", "SUCCESS", "FAILED", "SETTLEMENT_COMPLETED", "PAID"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },

    amount:   { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false },

    reason:        { type: DataTypes.STRING, allowNull: true },
    customerEmail: { type: DataTypes.STRING, allowNull: true },
    customerPhone: { type: DataTypes.STRING, allowNull: true },
    paymentMethod: { type: DataTypes.STRING, allowNull: true },
    plaqueType:    { type: DataTypes.STRING, allowNull: true },

    paid: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    transactionOperationStatus: { type: DataTypes.STRING, allowNull: true },
    fullWebhookPayload:         { type: DataTypes.JSONB, allowNull: true },
    providerResponsePayload:    { type: DataTypes.JSONB, allowNull: true },

    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    albumId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "albums", key: "id" },
      onDelete: "SET NULL",
    },
    // Set at payment-initiation time to snapshot whether this purchase earned a plaque.
// Null means the payment was not part of a plaque bid (e.g. post-launch support).
qualifiesForPlaque: {
  type: DataTypes.BOOLEAN,
  allowNull: true,
  defaultValue: null,
  comment: "Snapshot of launch-active + tier-eligible at initiate time. Frozen.",
},

// Which tier the amount would earn if launch were active. Null if below threshold.
qualifiedTier: {
  type: DataTypes.STRING(20),
  allowNull: true,
  comment: "Plaque tier the amount qualifies for. Snapshot at initiate time.",
},
// models/Payment.js — add
isDemo: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  comment: "True if this payment was bypassed by a demo account.",
},
  },
  {
    tableName: "payments",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["referenceNumber"], name: "payments_reference_unique" },
      {
        unique: true,
        fields: ["ecocashReference"],
        name: "payments_ecocash_unique",
        where: { ecocashReference: { [Op.ne]: null } },
      },
      { fields: ["status"] },
      { fields: ["customerPhone"] },
      { fields: ["userId"] },
      { fields: ["albumId"] },
    ],
  }
);

module.exports = Payment;