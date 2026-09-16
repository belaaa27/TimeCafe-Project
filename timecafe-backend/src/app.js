const express = require("express");
const cors = require("cors");
const path = require("path"); // 1. IMPORT PATH

// Import routes
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const staffRoutes = require("./routes/staffRoutes");

const app = express();

// Fallback to local frontend URL if environment variable is not defined
const CLIENT_URL = process.env.CLIENT_URL || "http://127.0.0.1:5500";

// Middlewares
app.use(
  cors({
    origin: CLIENT_URL,
  }),
);
app.use(express.json());

// 2. SERVE UPLOADED IMAGES STATICALLY
// "../uploads" steps out of src/ into your project root's uploads/ folder
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/foods", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/staff", staffRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.send("TimeCafe API is running...");
});

// Chapa redirect route
app.get("/payment-success", (req, res) => {
  const tx_ref = req.query.tx_ref;
  res.redirect(
    `${CLIENT_URL}/timecafe-frontend/order-confirmation.html?tx_ref=${tx_ref}`,
  );
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;
