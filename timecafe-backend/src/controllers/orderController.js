const { Op } = require("sequelize");
const {
  Order,
  OrderItem,
  Product,
  User,
  Payment,
  sequelize,
} = require("../models");
const chapaService = require("../services/chapaService");

// Helper to generate custom Order IDs (e.g., TC-123456)
const generateOrderId = () => {
  return "TC-" + Math.floor(100000 + Math.random() * 900000);
};

// Helper to generate unique transaction references
const generateTxRef = () => {
  return `TC-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// @desc    Create new order & Initialize Payment
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  // Start a managed database transaction
  const t = await sequelize.transaction();

  try {
    const {
      items,
      deliveryInfo,
      paymentMethod = "chapa",
      returnUrl,
    } = req.body;

    // 1. Basic Validation
    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No order items provided." });
    }

    const finalDeliveryInfo = deliveryInfo || {
      city: req.user.city || "Addis Ababa",
      area: req.user.area,
      address: req.user.address,
      phone: req.user.phone,
      instructions: req.user.instructions || "",
    };

    if (!finalDeliveryInfo.address || !finalDeliveryInfo.phone) {
      return res.status(400).json({
        success: false,
        message: "Delivery address and phone number are required.",
      });
    }

    // 2. Process Items and Calculate Totals
    let calculatedSubtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        transaction: t,
      });

      if (!product) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found.`,
        });
      }

      if (!product.is_available) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Item ${product.name} is currently unavailable.`,
        });
      }

      const quantity = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(product.price);

      calculatedSubtotal += unitPrice * quantity;

      processedItems.push({
        product_id: product.id,
        quantity: quantity,
        unit_price: unitPrice,
      });
    }

    // 3. Create the Order
    const deliveryFee = 50.0;
    const totalAmount = calculatedSubtotal + deliveryFee;

    const order = await Order.create(
      {
        id: generateOrderId(),
        user_id: req.user.id,
        subtotal: calculatedSubtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        delivery_snapshot: finalDeliveryInfo,
        status: "pending", // Order stays pending until paid
      },
      { transaction: t },
    );

    // 4. Create the Order Items
    for (const pItem of processedItems) {
      await OrderItem.create(
        {
          order_id: order.id,
          product_id: pItem.product_id,
          quantity: pItem.quantity,
          unit_price: pItem.unit_price,
        },
        { transaction: t },
      );
    }

    // 5. Create Payment Record
    const txRef = generateTxRef();
    await Payment.create(
      {
        order_id: order.id,
        method: paymentMethod,
        status: "pending",
        transaction_ref: txRef,
      },
      { transaction: t },
    );

    // 6. Commit DB transaction
    await t.commit();

    // 7. Initialize Chapa Payment (if selected)
    let checkoutUrl = null;
    if (paymentMethod === "chapa") {
      const nameParts = (req.user.fullName || "Valued Customer")
        .trim()
        .split(" ");
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || "User";

      // Load environment bases dynamically
      const BACKEND_URL = process.env.BACKEND_URL;
      const CLIENT_URL = process.env.CLIENT_URL;

      const chapaPayload = {
        amount: totalAmount.toString(),
        currency: "ETB",
        email: req.user.email,
        first_name: firstName,
        last_name: lastName,
        phone_number: req.user.phone || undefined,
        tx_ref: txRef,
        callback_url:
          process.env.CHAPA_CALLBACK_URL ||
          `${BACKEND_URL}/api/payments/webhook`,
        return_url:
          returnUrl ||
          `${CLIENT_URL}/pages/payment-success.html?tx_ref=${txRef}`,
        customization: {
          title: "TimeCafe",
          description: `Payment for Order ${order.id}`,
        },
      };

      const chapaResponse = await chapaService.initializePayment(chapaPayload);

      if (chapaResponse && chapaResponse.status === "success") {
        checkoutUrl = chapaResponse.data.checkout_url;
      } else {
        console.error("Chapa Init Failed:", chapaResponse);
        return res.status(502).json({
          success: false,
          message:
            chapaResponse?.message ||
            "Order created, but Chapa payment gateway rejected the request.",
          chapaDetails: chapaResponse || null,
          data: { orderId: order.id },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: {
        orderId: order.id,
        totalAmount: order.total_amount,
        checkoutUrl,
        paymentStatus:
          paymentMethod === "chapa" ? "pending" : "cash_on_delivery",
      },
    });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("Order Creation Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while creating order." });
  }
};

// @desc    Verify Chapa payment & update order state
// @route   GET /api/orders/verify/:tx_ref
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    // 1. Find the payment record matching this transaction reference
    const payment = await Payment.findOne({
      where: { transaction_ref: tx_ref },
    });

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found." });
    }

    // 2. Call Chapa verification service
    const verifyRes = await chapaService.verifyPayment(tx_ref);

    if (verifyRes && verifyRes.status === "success") {
      // 3. Update Payment record
      payment.status = "paid";
      await payment.save();

      // 4. Update associated Order status
      const order = await Order.findByPk(payment.order_id);
      if (order) {
        order.status = "preparing";
        await order.save();
      }

      // 5. Retrieve full order details to return to UI
      const updatedOrder = await Order.findOne({
        where: { id: payment.order_id, user_id: req.user.id },
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["id", "name", "image_url"],
              },
            ],
          },
          { model: Payment, as: "payment" },
        ],
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
        data: updatedOrder,
      });
    } else {
      // Payment verification failed with Chapa
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        success: false,
        message:
          verifyRes?.message || "Payment verification failed with gateway.",
      });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while verifying payment.",
    });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name", "image_url", "category"],
            },
          ],
        },
        { model: Payment, as: "payment" },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching orders." });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url"],
            },
          ],
        },
        { model: Payment, as: "payment" },
      ],
    });

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching order details.",
    });
  }
};

// ==========================================
// ADMIN ORDER CONTROLLERS
// ==========================================

exports.adminGetAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product", attributes: ["name"] }],
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "fullName", "phone"],
        },
        { model: Payment, as: "payment" },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching all orders." });
  }
};

exports.adminGetOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "fullName", "email", "phone"],
        },
        { model: Payment, as: "payment" },
      ],
    });

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching order details.",
    });
  }
};

exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status." });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      data: order,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error updating order status." });
  }
};

// GET /api/orders/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    // 1. Total Sales (sum of total_amount for non-cancelled orders)
    const totalSalesSum = await Order.sum("total_amount", {
      where: {
        status: { [Op.ne]: "cancelled" },
      },
    });

    // 2. Count pending orders
    const pendingOrdersCount = await Order.count({
      where: { status: "pending" },
    });

    // 3. Count active products
    const totalProductsCount = await Product.count();

    // 4. Count total orders
    const totalOrdersCount = await Order.count();

    res.status(200).json({
      success: true,
      data: {
        totalSales: Number(totalSalesSum || 0).toFixed(2),
        pendingOrders: pendingOrdersCount,
        totalProducts: totalProductsCount,
        totalOrders: totalOrdersCount,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard statistics",
      error: error.message,
    });
  }
};
