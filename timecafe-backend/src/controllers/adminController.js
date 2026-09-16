const { Order, Product, User, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalProducts = await Product.count();

    // Flexible case-insensitive matching for 'pending'
    const pendingOrders = await Order.count({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("status")),
        "LIKE",
        "%pending%",
      ),
    });

    console.log("------------------------------------");
    console.log("DEBUG - Total Orders in DB:", totalOrders);
    console.log("DEBUG - Pending Orders Counted:", pendingOrders);
    console.log("------------------------------------");

    const rawSales =
      (await Order.sum("total_amount", {
        where: {
          status: { [Op.ne]: "cancelled" },
        },
      })) || 0;

    res.status(200).json({
      success: true,
      data: {
        totalSales: Number(rawSales).toFixed(2),
        pendingOrders: pendingOrders,
        totalProducts: totalProducts,
        totalOrders: totalOrders,
      },
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching stats.",
      error: error.message,
    });
  }
};
