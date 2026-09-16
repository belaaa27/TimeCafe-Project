const { Payment, Order } = require("../models");
const chapaService = require("../services/chapaService");

/**
 * Handle successful payment updates (Idempotent)
 * This logic is shared between the manual verify and the background webhook.
 */
const handleSuccessfulPayment = async (tx_ref) => {
  const payment = await Payment.findOne({ where: { transaction_ref: tx_ref } });

  if (!payment) {
    throw new Error("Payment record not found for this transaction reference.");
  }

  // IDEMPOTENCY CHECK: If it's already paid, do nothing!
  // This prevents duplicate updates if Webhook and Verify hit at the same time.
  if (payment.status === "paid") {
    return {
      success: true,
      message: "Payment was already verified previously.",
    };
  }

  // Update Payment DB Record
  payment.status = "paid";
  await payment.save();

  // Update Order DB Record
  const order = await Order.findByPk(payment.order_id);
  if (order && order.status === "pending") {
    order.status = "preparing"; // Move order to kitchen queue
    await order.save();
  }

  return {
    success: true,
    message: "Payment successfully verified and order updated.",
  };
};

// @desc    Verify Payment Status via API
// @route   GET /api/payments/verify/:tx_ref
// @access  Public (Because the frontend hits this when redirecting back)
exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    // 1. Always ask Chapa if this transaction actually succeeded
    const chapaResponse = await chapaService.verifyPayment(tx_ref);

    if (
      chapaResponse.status === "success" &&
      chapaResponse.data.status === "success"
    ) {
      // 2. If Chapa confirms, update our database securely
      const result = await handleSuccessfulPayment(tx_ref);
      return res.status(200).json(result);
    } else {
      return res
        .status(400)
        .json({
          success: false,
          message: "Payment not successful or pending.",
        });
    }
  } catch (error) {
    console.error("Manual Verification Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error verifying payment." });
  }
};

// @desc    Chapa Webhook handler (Background process)
// @route   POST /api/payments/webhook
// @access  Public (Called by Chapa Servers)
exports.chapaWebhook = async (req, res) => {
  try {
    // Chapa sends the event details in the request body
    const event = req.body;

    // Log the webhook for debugging
    console.log("Chapa Webhook Received:", event.event, event.tx_ref);

    // We only care about successful charges
    if (event.event === "charge.success") {
      // Even though it's a webhook, we double-check with Chapa to prevent spoofing
      const chapaResponse = await chapaService.verifyPayment(event.tx_ref);

      if (
        chapaResponse.status === "success" &&
        chapaResponse.data.status === "success"
      ) {
        await handleSuccessfulPayment(event.tx_ref);
      }
    }

    // Always return 200 OK to Chapa immediately so they know we received it
    res.status(200).send("Webhook Received");
  } catch (error) {
    console.error("Webhook Processing Error:", error);
    res.status(500).send("Webhook Processing Error");
  }
};
