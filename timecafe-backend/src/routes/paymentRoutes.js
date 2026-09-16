const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Frontend redirects user here or fetches this after payment
router.get("/verify/:tx_ref", paymentController.verifyPayment);

// Background webhook endpoint for Chapa servers
router.post("/webhook", paymentController.chapaWebhook);

module.exports = router;
