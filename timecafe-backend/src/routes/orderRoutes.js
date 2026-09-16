const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, admin } = require("../middlewares/authMiddleware");

// All order routes require the user to be logged in
router.use(protect);

// ==========================================
// ADMIN ROUTES (Must be before /:id routes)
// ==========================================
router.get("/admin/stats", admin, orderController.getAdminStats); // <-- NEW STATS ENDPOINT
router.get("/admin", admin, orderController.adminGetAllOrders);
router.get("/admin/:id", admin, orderController.adminGetOrderById);
router.put("/admin/:id/status", admin, orderController.adminUpdateOrderStatus);

// ==========================================
// CUSTOMER ROUTES
// ==========================================
router.post("/", orderController.createOrder);
router.get("/", orderController.getMyOrders);

// NEW: Chapa Payment Verification
// MUST be placed before "/:id" so Express doesn't treat "verify" as an order ID
router.get("/verify/:tx_ref", orderController.verifyPayment);

// Get specific order by ID
router.get("/:id", orderController.getOrderById);

module.exports = router;
