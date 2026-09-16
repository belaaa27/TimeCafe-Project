const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Public route to get unique categories
router.get("/", productController.getCategories);

// Admin routes to rename and delete categories across products
router.put("/rename", productController.renameCategory);
router.delete("/:name", productController.deleteCategory);

module.exports = router;
