const { Op } = require("sequelize");
const { User } = require("../models"); // Adjust path if needed

// GET /api/staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        role: { [Op.in]: ["admin", "super_admin"] },
      },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    // Remap fullName to name for the frontend response
    const formattedStaff = staff.map((s) => {
      const data = s.toJSON();
      return {
        ...data,
        name: data.fullName,
      };
    });

    res.status(200).json({ success: true, data: formattedStaff });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch staff list",
        error: error.message,
      });
  }
};

// POST /api/staff
exports.createStaff = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Name, email, and password are required",
      });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User with this email already exists",
        });
    }

    // Do NOT hash manually - User model's beforeSave hook handles it automatically
    const newStaff = await User.create({
      fullName: name,
      email,
      password,
      role: role === "super_admin" ? "super_admin" : "admin",
    });

    const staffData = newStaff.toJSON();
    delete staffData.password;
    staffData.name = staffData.fullName;

    res.status(201).json({ success: true, data: staffData });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create staff account",
        error: error.message,
      });
  }
};

// PUT /api/staff/:id
exports.updateStaff = async (req, res) => {
  const { name, email, role, password } = req.body;

  try {
    const staff = await User.findByPk(req.params.id);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff account not found" });
    }

    if (name) staff.fullName = name;
    if (email) staff.email = email;
    if (role) staff.role = role;

    // Setting password triggers user.changed("password") in beforeSave hook
    if (password && password.trim() !== "") {
      staff.password = password;
    }

    await staff.save();

    const updatedData = staff.toJSON();
    delete updatedData.password;
    updatedData.name = updatedData.fullName;

    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update staff account",
        error: error.message,
      });
  }
};

// DELETE /api/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You cannot delete your own active account",
        });
    }

    const staff = await User.findByPk(req.params.id);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff account not found" });
    }

    await staff.destroy();
    res
      .status(200)
      .json({ success: true, message: "Staff account deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete staff account",
        error: error.message,
      });
  }
};
