const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true, // Made optional so staff accounts can be created without requiring a phone number
    },
    city: { type: DataTypes.STRING, defaultValue: "Addis Ababa" },
    area: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    instructions: { type: DataTypes.TEXT, allowNull: true },

    role: {
      type: DataTypes.ENUM("customer", "admin", "super_admin"), // Added super_admin
      defaultValue: "customer",
    },
  },
  {
    timestamps: true,
    hooks: {
      // Hash password before saving to database
      beforeSave: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    indexes: [{ unique: true, fields: ["email"] }],
  },
);

// Instance method to check password validity
User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
