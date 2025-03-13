const router = require("express").Router();
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// SIGNUP
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (email === "" || password === "" || name === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    const completeUser = await User.findById(user._id);

    const payload = {
      _id: completeUser._id,
      email: completeUser.email,
      name: completeUser.name,
      profilePicture: completeUser.profilePicture || "",
      isAdmin: completeUser.isAdmin || false, 
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(201).json({
      user: {
        id: completeUser._id,
        email: completeUser.email,
        name: completeUser.name,
        profilePicture: completeUser.profilePicture || "",
        isAdmin: completeUser.isAdmin || false, 
      },
      token: authToken,
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (email === "" || password === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credentials not valid" });
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Credentials not valid" });
    }

    const payload = {
      _id: user._id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture || "",
      isAdmin: user.isAdmin || false, 
    };

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture || "",
        isAdmin: user.isAdmin || false, 
      },
      token: authToken,
    });
  } catch (error) {
    next(error);
  }
});

// VERIFY
router.get("/verify", isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      _id: user._id, 
      name: user.name,
      username: user.name,
      email: user.email,
      profilePicture: user.profilePicture || "",
      bio: user.bio || "",
      joinedAt: user.createdAt,
      address: user.address,
      phone: user.phone,
      isAdmin: user.isAdmin || false, 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
