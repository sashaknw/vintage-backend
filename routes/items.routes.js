const router = require("express").Router();
const Item = require("../models/Item.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { uploadCloud } = require("../config/cloudinary.config"); // Add Cloudinary upload

// Get all items
router.get("/", async (req, res, next) => {
  try {
    const { category, brand, era, condition, minPrice, maxPrice } = req.query;
    let filter = {};

    // Advanced filtering
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (era) filter.era = era;
    if (condition) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Find items that match the filter
    const items = await Item.find(filter).populate("seller", "username");
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Get single item
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id).populate("seller", "username");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    next(error);
  }
});

// Create new item (protected route - only authenticated users)
router.post(
  "/",
  isAuthenticated,
  uploadCloud.array("images"), // Cloudinary upload middleware
  async (req, res, next) => {
    try {
      const {
        name,
        description,
        price,
        size,
        category,
        condition,
        era,
        brand,
        inStock,
      } = req.body;

      // Get image URLs from Cloudinary upload
      const images = req.files ? req.files.map((file) => file.path) : [];

      // Add the current user as the seller
      const newItem = await Item.create({
        name,
        description,
        price: parseFloat(price),
        size,
        category,
        condition,
        era,
        brand,
        images,
        inStock: inStock === "true" || inStock === true,
        seller: req.payload._id, // from JWT middleware
      });

      res.status(201).json(newItem);
    } catch (error) {
      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation Error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }
      next(error);
    }
  }
);

// Update item (protected - only the seller can update)
router.put(
  "/:id",
  isAuthenticated,
  uploadCloud.array("images"), // Cloudinary upload middleware
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        size,
        category,
        condition,
        era,
        brand,
        inStock,
        existingImages, // For keeping existing images
      } = req.body;

      // First check if item exists and current user is the seller
      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Check if current user is the seller
      if (item.seller.toString() !== req.payload._id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this item" });
      }

      // Get new image URLs from Cloudinary upload
      const newImages = req.files ? req.files.map((file) => file.path) : [];

      // Combine existing and new images
      const images = [
        ...(existingImages ? JSON.parse(existingImages) : []),
        ...newImages,
      ];

      // Update the item
      const updatedItem = await Item.findByIdAndUpdate(
        id,
        {
          name,
          description,
          price: parseFloat(price),
          size,
          category,
          condition,
          era,
          brand,
          images,
          inStock: inStock === "true" || inStock === true,
        },
        {
          new: true, // Return the updated document
          runValidators: true, // Ensure model validations run on update
        }
      );

      res.json(updatedItem);
    } catch (error) {
      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation Error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }
      next(error);
    }
  }
);

// Delete item (protected - only the seller can delete)
router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;

    // First check if item exists and current user is the seller
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if current user is the seller
    if (item.seller.toString() !== req.payload._id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this item" });
    }

    // Delete the item
    await Item.findByIdAndDelete(id);

    res.status(204).send(); // No content response for successful delete
  } catch (error) {
    next(error);
  }
});

module.exports = router;
