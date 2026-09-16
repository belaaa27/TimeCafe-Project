const sequelize = require("../config/database");
const User = require("./User");
const Product = require("./Product");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Payment = require("./Payment");

// 1. User -> Orders (One-to-Many)
User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "user_id", as: "customer" });

// 2. Order -> OrderItems (One-to-Many)
Order.hasMany(OrderItem, {
  foreignKey: "order_id",
  as: "items",
  onDelete: "CASCADE",
});
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

// 3. Product -> OrderItems (One-to-Many)
Product.hasMany(OrderItem, { foreignKey: "product_id", as: "order_items" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// 4. Order -> Payment (One-to-One)
Order.hasOne(Payment, {
  foreignKey: "order_id",
  as: "payment",
  onDelete: "CASCADE",
});
Payment.belongsTo(Order, { foreignKey: "order_id" });

// Export everything along with the connection instance
module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  Payment,
};
