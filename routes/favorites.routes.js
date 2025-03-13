const router = require("express").Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const User = require("../models/User.model");
const Item = require("../models/Item.model");
const Favorite = require("../models/Favorite.model");

router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const favorites = await Favorite.find({ user: userId })
      .populate("item")
      .sort({ createdAt: -1 });

    res.json(
      favorites.map((favorite) => ({
        id: favorite.item._id,
        name: favorite.item.name,
        price: favorite.item.price,
        era: favorite.item.era,
        size: favorite.item.size,
        condition: favorite.item.condition,
        images: favorite.item.images,
        image: favorite.item.images[0],
        addedAt: favorite.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/check", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { itemId } = req.query;

    const favorite = await Favorite.findOne({
      user: userId,
      item: itemId,
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    next(error);
  }
});

router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { itemId } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const existingFavorite = await Favorite.findOne({
      user: userId,
      item: itemId,
    });

    if (existingFavorite) {
      return res.status(400).json({ message: "Item already in favorites" });
    }

    const favorite = await Favorite.create({
      user: userId,
      item: itemId,
    });

    res.status(201).json({ message: "Item added to favorites" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:itemId", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { itemId } = req.params;

    const result = await Favorite.findOneAndDelete({
      user: userId,
      item: itemId,
    });

    if (!result) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.json({ message: "Item removed from favorites" });
  } catch (error) {
    next(error);
  }
});

router.get("/user/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const favorites = await Favorite.find({ user: userId })
      .populate("item")
      .sort({ createdAt: -1 });
    
    res.json(
      favorites.map((favorite) => ({
        id: favorite.item._id,
        name: favorite.item.name,
        price: favorite.item.price,
        era: favorite.item.era,
        size: favorite.item.size,
        condition: favorite.item.condition,
        images: favorite.item.images,
        image: favorite.item.images[0],
        addedAt: favorite.createdAt,
      }))
    );
  } catch (error) {
    next(error);
  }
});


module.exports = router;
