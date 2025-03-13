const router = require("express").Router();
const Item = require("../models/Item.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { uploadCloud } = require("../config/cloudinary.config");

router.get("/", async (req, res, next) => {
  try {
    const { category, brand, era, condition, size, minPrice, maxPrice } =
      req.query;
    let filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (era) filter.era = era;
    if (size) filter.size = size;
    if (condition) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const items = await Item.find(filter).populate("seller", "name");
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Get single item
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id).populate("seller", "name");

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

router.post(
  "/upload",
  isAuthenticated,
  uploadCloud.single("image"),
  async (req, res, next) => {
    try {
      const isAdmin = req.payload.isAdmin;

      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "Only admins can upload images" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      res.status(200).json({
        imageUrl: req.file.path,
        message: "Image uploaded successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const isAdmin = req.payload.isAdmin;

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can create new items" });
    }

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
      images,
    } = req.body;

    const newItem = await Item.create({
      name,
      description,
      price: parseFloat(price),
      size,
      category,
      condition,
      era,
      brand,
      images: Array.isArray(images) ? images : [images].filter(Boolean),
      inStock: inStock === "true" || inStock === true || inStock === undefined,
      seller: req.payload._id, 
    });

    res.status(201).json(newItem);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    next(error);
  }
});

router.put("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAdmin = req.payload.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can update items" });
    }

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
      images,
    } = req.body;

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

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
        images: Array.isArray(images) ? images : [images].filter(Boolean),
        inStock:
          inStock === "true" || inStock === true || inStock === undefined,
      },
      {
        new: true, 
        runValidators: true,
      }
    );

    res.json(updatedItem);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    next(error);
  }
});

router.delete("/:id", isAuthenticated, async (req, res, next) => {
  try {
    const { id } = req.params;

    const isAdmin = req.payload.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can delete items" });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await Item.findByIdAndDelete(id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
