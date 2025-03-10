// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

const express = require("express");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: [
      process.env.ORIGIN,
      "https://vintage-vault-shop.netlify.app",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const itemsRoutes = require("./routes/items.routes");
app.use("/api/items", itemsRoutes);

const ordersRoutes = require("./routes/orders.routes");
app.use("/api/orders", ordersRoutes);

const favoritesRoutes = require("./routes/favorites.routes");
app.use("/api/favorites", favoritesRoutes);

const forumRoutes = require("./routes/forum.routes");
app.use("/api/forum", forumRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);


// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
// This should always be the last middleware to register
require("./error-handling")(app);

module.exports = app;
