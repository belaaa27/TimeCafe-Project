const { User } = require("../models");
const { generateToken } = require("../utils/jwt");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    // Check for duplicate email
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "Email is already registered." });
    }

    // Create user (password is hashed automatically by Sequelize hook in User.js)
    const user = await User.create({ fullName, email, password, phone });

    // Generate JWT
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration." });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    // Check if password matches (Using instance method from User.js)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private (Requires Token)
exports.getMe = async (req, res) => {
  try {
    // req.user is set by the 'protect' middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching profile." });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;

    // Look for fullName instead of name
    const { fullName, name, phone } = req.body;

    // Accept either 'fullName' or 'name' just in case, but save to user.fullName
    const newName = fullName || name;
    if (newName) user.fullName = newName;

    if (phone) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: user,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating profile." });
  }
};
