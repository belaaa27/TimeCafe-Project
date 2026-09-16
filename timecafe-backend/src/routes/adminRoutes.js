const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/adminController");
// Include your admin auth middleware here if you have one

router.get("/stats", getDashboardStats);

module.exports = router;
