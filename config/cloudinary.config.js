// config/cloudinary.config.js
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vintage-store", // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const uploadCloud = multer({ storage });

module.exports = {
  cloudinary,
  uploadCloud,
};
