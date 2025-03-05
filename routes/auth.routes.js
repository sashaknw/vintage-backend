// routes/auth.routes.js
const router = require("express").Router();
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middleware/jwt.middleware");

// SIGNUP
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if email or password or name are provided as empty strings
    if (email === "" || password === "" || name === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    // Create a payload for the JWT
    const payload = { _id: user._id, email: user.email, name: user.name };

    // Create and sign the token
    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(201).json({ user: payload, token: authToken });
  } catch (error) {
    next(error);
  }
});

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email or password are provided as empty strings
    if (email === "" || password === "") {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credentials not valid" });
    }

    // Compare the provided password with the one saved in the database
    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Credentials not valid" });
    }

    // Create a payload for the JWT
    const payload = { _id: user._id, email: user.email, name: user.name };

    // Create and sign the token
    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "6h",
    });

    res.status(200).json({ user: payload, token: authToken });
  } catch (error) {
    next(error);
  }
});

// VERIFY
router.get("/verify", isAuthenticated, (req, res) => {
  res.json(req.payload);
});

module.exports = router;
