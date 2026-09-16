const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Protect routes - requires valid JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User belonging to this token no longer exists.",
        });
      }

      return next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed or expired.",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided.",
    });
  }
};

// Restrict access to Admin OR Superadmin
const admin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "super_admin")
  ) {
    next();
  } else {
    res
      .status(403)
      .json({ success: false, message: "Not authorized as an admin." });
  }
};

// Restrict access STRICTLY to Superadmin
const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === "super_admin") {
    next();
  } else {
    res
      .status(403)
      .json({
        success: false,
        message: "Access denied: Superadmin privileges required.",
      });
  }
};

module.exports = { protect, admin, superAdmin };
