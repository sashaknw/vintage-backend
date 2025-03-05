const router = require("express").Router();
const Item = require("../models/Item.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// Get all items
router.get("/", async (req, res, next) => {
  try {
    const { category } = req.query;
    let filter = {};

    // If category query parameter is provided, add it to the filter
    if (category) {
      filter.category = category;
    }

    // Find items that match the filter
    const items = await Item.find(filter);
    res.json(items);
  } catch (error) {
    next(error);
  }
});


// Get single item
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Create new item (protected route - only authenticated users)
router.post("/", isAuthenticated, async (req, res, next) => {
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
      images,
    } = req.body;

    // Add the current user as the seller
    const newItem = await Item.create({
      name,
      description,
      price,
      size,
      category,
      condition,
      era,
      brand,
      images,
      seller: req.payload._id, // from JWT middleware
    });

    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
});

// Update item (protected - only the seller can update)
router.put("/:id", isAuthenticated, async (req, res, next) => {
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
      images,
      inStock,
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

    // Update the item
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        size,
        category,
        condition,
        era,
        brand,
        images,
        inStock,
      },
      { new: true } // Return the updated document
    );

    res.json(updatedItem);
  } catch (error) {
    next(error);
  }
});

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
