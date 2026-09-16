const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe); // Protected route
// Add this right under your router.get("/me", ...) line
router.put("/update", protect, authController.updateProfile);

module.exports = router;
