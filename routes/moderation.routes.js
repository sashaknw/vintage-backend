// routes/moderation.routes.js
const router = require("express").Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const moderationController = require("../controllers/moderation.controller");
const User = require("../models/User.model");

// Admin check middleware 
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Error checking admin status" });
  }
};

router.get(
  "/pending",
  isAuthenticated,
  isAdmin,
  moderationController.getPendingModerations
);

router.post(
  "/decision/:moderationId",
  isAuthenticated,
  isAdmin,
  moderationController.processModerationDecision
);

router.get(
  "/suggest/:moderationId",
  isAuthenticated,
  isAdmin,
  moderationController.getContentImprovement
);

router.get(
  "/report",
  isAuthenticated,
  isAdmin,
  moderationController.generateModerationReport
);

router.get(
  "/settings",
  isAuthenticated,
  isAdmin,
  moderationController.getModerationSettings
);

router.put(
  "/settings",
  isAuthenticated,
  isAdmin,
  moderationController.updateModerationSettings
);

module.exports = router;
