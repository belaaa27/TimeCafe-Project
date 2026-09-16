const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    method: {
      type: DataTypes.ENUM("chapa", "cash"),
      allowNull: false,
      defaultValue: "chapa",
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
    },
    // Third-party transaction reference (Chapa tx_ref)
    transaction_ref: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["status"] }, { fields: ["transaction_ref"] }],
  },
);

module.exports = Payment;
