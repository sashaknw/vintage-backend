// ℹ️ Gets access to environment variables/settings
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
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
      "https://vintage-vault-shop.netlify.app", // Your production site
      "http://localhost:3000", // Another common local development port
    ],
    credentials: true,
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

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
// This should always be the last middleware to register
require("./error-handling")(app);

module.exports = app;
