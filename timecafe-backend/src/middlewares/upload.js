const multer = require("multer");
const path = require("path");

// Use memory storage to store files in RAM buffer for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extName = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, JPEG, PNG, WEBP, GIF) are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB size limit
  fileFilter: fileFilter,
});

module.exports = upload;
