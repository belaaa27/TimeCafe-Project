const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    // Custom String ID (e.g., 'TC-984213')
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ),
      defaultValue: "pending",
    },
    // Snapshot of delivery address at the time of order
    delivery_snapshot: {
      type: DataTypes.JSON, // Stores city, area, address, instructions securely
      allowNull: false,
    },
    estimated_delivery_time: {
      type: DataTypes.STRING,
      defaultValue: "30 - 45 Minutes",
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["status"] }, { fields: ["createdAt"] }],
  },
);

module.exports = Order;
