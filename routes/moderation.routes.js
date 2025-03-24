const router = require("express").Router();
const { isAuthenticated } = require("../middleware/jwt.middleware");
const moderationController = require("../controllers/moderation.controller");
const User = require("../models/User.model");
const rateLimit = require("express-rate-limit");

const moderationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, 
  legacyHeaders: false, 
});


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

router.use(moderationLimiter);

router.get(
  "/pending",
  isAuthenticated,
  isAdmin,
  moderationController.getPendingModerations
);

router.post(
  "/:moderationId/process",
  isAuthenticated,
  isAdmin,
  moderationController.processModerationDecision
);

router.get(
  "/:moderationId/suggest-improvement",
  isAuthenticated,
  isAdmin,
  moderationController.getContentImprovement
);

router.get(
  "/report",
  isAuthenticated,
  isAdmin,
  moderationController.getModerationReport
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
