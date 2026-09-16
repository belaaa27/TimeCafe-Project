const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, admin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload"); // Uses your Step 2 middleware

// Public routes
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// Admin-only routes
router.post(
  "/",
  protect,
  admin,
  upload.single("image"),
  productController.createProduct,
);

router.put(
  "/:id",
  protect,
  admin,
  upload.single("image"),
  productController.updateProduct,
);

router.delete("/:id", protect, admin, productController.deleteProduct);

module.exports = router;
