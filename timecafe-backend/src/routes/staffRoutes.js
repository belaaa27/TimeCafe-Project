const express = require("express");
const router = express.Router();
const {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} = require("../controllers/staffController");
const { protect, superAdmin } = require("../middlewares/authMiddleware"); // Adjust relative path as needed

// All staff endpoints require JWT + Superadmin role
router.use(protect, superAdmin);

router.route("/").get(getAllStaff).post(createStaff);

router.route("/:id").put(updateStaff).delete(deleteStaff);

module.exports = router;
