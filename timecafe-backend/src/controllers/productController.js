const { Product } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

/**
 * Stream buffer directly to Cloudinary
 */
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "timecafe/products",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      },
    );
    stream.end(fileBuffer);
  });
};

/**
 * Helper to safely delete legacy local upload files
 */
const deleteLocalFile = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const relativePath = imageUrl.replace(/^\/+/, "");
  const fullPath = path.join(__dirname, "../../", relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.error("Failed to delete local file:", err);
    });
  }
};

// @desc    Get all foods (with pagination, search, & filter)
// @route   GET /api/foods
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const category = req.query.category || "";

    const whereClause = {};

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }
    if (category) {
      whereClause.category = category;
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching foods." });
  }
};

// @desc    Get single food by ID
// @route   GET /api/foods/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Food item not found." });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error fetching the food item.",
    });
  }
};

// @desc    Create a new food item
// @route   POST /api/foods
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, category, image_url, is_available } =
      req.body;

    // Validate required fields
    if (!name || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Name and price are required." });
    }

    let finalImageUrl = image_url || null;

    // Upload memory buffer to Cloudinary if an image file was provided
    if (req.file) {
      const uploadResult = await streamUpload(req.file.buffer);
      finalImageUrl = uploadResult.secure_url;
    }

    const parsedPrice = parseFloat(price);
    const parsedAvailable = is_available === "true" || is_available === true;

    const product = await Product.create({
      name,
      price: parsedPrice,
      description,
      category: category || "General",
      image_url: finalImageUrl,
      is_available: is_available !== undefined ? parsedAvailable : true,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("Error creating product:", error.message || error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating food item." });
  }
};

// @desc    Update a food item
// @route   PUT /api/foods/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findByPk(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Food item not found." });
    }

    const { name, price, description, category, image_url, is_available } =
      req.body;

    const oldImageUrl = product.image_url;
    let finalImageUrl = oldImageUrl;

    if (req.file) {
      const uploadResult = await streamUpload(req.file.buffer);
      finalImageUrl = uploadResult.secure_url;

      // Safely delete legacy local disk file if replaced
      if (oldImageUrl && oldImageUrl.startsWith("/uploads/")) {
        deleteLocalFile(oldImageUrl);
      }
    } else if (image_url) {
      finalImageUrl = image_url;
    }

    const updateData = {
      image_url: finalImageUrl,
    };

    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (is_available !== undefined) {
      updateData.is_available =
        is_available === "true" || is_available === true;
    }

    product = await product.update(updateData);

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating product:", error.message || error);
    res
      .status(500)
      .json({ success: false, message: "Server error updating food item." });
  }
};

// @desc    Delete a food item
// @route   DELETE /api/foods/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Food item not found." });
    }

    const imageUrl = product.image_url;
    await product.destroy();

    // Clean up local disk image only if it was a legacy local upload
    if (imageUrl && imageUrl.startsWith("/uploads/")) {
      deleteLocalFile(imageUrl);
    }

    res
      .status(200)
      .json({ success: true, message: "Food item removed successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error deleting food item." });
  }
};

// @desc    Get all unique food categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.findAll({
      attributes: ["category"],
      group: ["category"],
    });

    const categoryList = categories.map((cat) => cat.category).filter(Boolean);

    res.status(200).json({ success: true, data: categoryList });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching categories." });
  }
};

// @desc    Rename a category across all products
// @route   PUT /api/categories/rename
// @access  Private/Admin
exports.renameCategory = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res.status(400).json({
        success: false,
        message: "Both oldName and newName are required.",
      });
    }

    const [updatedCount] = await Product.update(
      { category: newName.trim() },
      { where: { category: oldName.trim() } },
    );

    res.status(200).json({
      success: true,
      message: `Successfully renamed category '${oldName}' to '${newName}' across ${updatedCount} products.`,
    });
  } catch (error) {
    console.error("Error renaming category:", error);
    res.status(500).json({
      success: false,
      message: "Server error renaming category.",
    });
  }
};

// @desc    Delete a category and reassign its products to 'General'
// @route   DELETE /api/categories/:name
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const categoryName = req.params.name;

    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Category name parameter is required.",
      });
    }

    // Reassign affected products to 'General' so they aren't lost
    const [updatedCount] = await Product.update(
      { category: "General" },
      { where: { category: categoryName } },
    );

    res.status(200).json({
      success: true,
      message: `Category '${categoryName}' deleted. Reassigned ${updatedCount} product(s) to 'General'.`,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting category.",
    });
  }
};
