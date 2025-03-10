// routes/user.routes.js
const router = require("express").Router();
const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary (if using it for profile picture uploads)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "vintage-vault/profile-pictures",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
  },
});

const upload = multer({ storage: storage });

// GET a user's public profile
router.get("/:userId/public", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "name email profilePicture bio createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add id field for client-side consistency
    const publicProfile = {
      id: user._id,
      name: user.name,
      username: user.name, // Using name as username for now (you can add a separate username field to your model)
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      joinedAt: user.createdAt,
    };

    res.status(200).json(publicProfile);
  } catch (error) {
    next(error);
  }
});

// GET current user's full profile (private) - requires authentication
router.get("/profile", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't send the password
    const userProfile = {
      id: user._id,
      name: user.name,
      username: user.name, // Using name as username for now
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      joinedAt: user.createdAt,
      address: user.address,
      phone: user.phone,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    next(error);
  }
});

// UPDATE current user's profile - requires authentication
router.put("/profile", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { name, email, bio, profilePicture, address, phone } = req.body;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;
    if (address) user.address = address;
    if (phone) user.phone = phone;

    const updatedUser = await user.save();

    // Create updated response
    const updatedProfile = {
      id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      joinedAt: updatedUser.createdAt,
      address: updatedUser.address,
      phone: updatedUser.phone,
    };

    res.status(200).json(updatedProfile);
  } catch (error) {
    next(error);
  }
});

// UPLOAD profile picture - requires authentication
router.post(
  "/profile-picture",
  isAuthenticated,
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      const userId = req.payload._id;

      // Get the uploaded file URL from Cloudinary
      const profilePictureUrl = req.file.path;

      // Update user with new profile picture URL
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: profilePictureUrl },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        profilePicture: updatedUser.profilePicture,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE user account - requires authentication
router.delete("/account", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// UPDATE password - requires authentication
router.put("/password", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
