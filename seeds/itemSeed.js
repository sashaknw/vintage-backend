
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Item = require("../models/Item.model");

// Don't import the User model, we'll create the user directly with mongoose
const MONGODB_URI = process.env.MONGODB_URI;

async function seedItems() {
  try {
    // Connect to the database
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for seeding items");

    // Define the User model manually in this script for testing
    const userSchema = new mongoose.Schema({
      email: String,
      password: String,
      name: String,
    });

    // Create the User model
    const User = mongoose.model("User", userSchema);

    // Find a user or create one
    let seller = await User.findOne();

    if (!seller) {
      console.log("No user found, creating a test user...");

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Password123", salt);

      // Create a test user
      seller = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
      });

      console.log("Created test user:", seller.name);
    }

    // Sample item data
    const itemsData = [
      {
        name: "Vintage Denim Jacket",
        description:
          "Classic 90s denim jacket with subtle distressing and brass buttons.",
        price: 65.0,
        size: "M",
        category: "outerwear",
        condition: "Good",
        era: "90s",
        brand: "Levi's",
        images: [
          "https://i.pinimg.com/originals/a0/89/a6/a089a6b41fb70d6a1e4d8b580dff8e1f.jpg",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "High-Waisted Mom Jeans",
        description:
          "Authentic vintage high-waisted jeans with a relaxed fit through the hips and legs.",
        price: 48.0,
        size: "M",
        category: "bottoms",
        condition: "Good",
        era: "80s",
        brand: "Wrangler",
        images: [
          "https://i.pinimg.com/originals/35/0a/28/350a28b9c0a9b95a1ba5f3592d8f719d.jpg",
        ],
        inStock: true,
        seller: seller._id,
      },
      // Include the rest of your items data here...
    ];
    // First, clear the existing items
    await Item.deleteMany({});
    console.log("Cleared existing items");

    // Insert the new items
    const insertedItems = await Item.insertMany(itemsData);
    console.log(`Successfully inserted ${insertedItems.length} items`);

    // Disconnect from the database
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding data:", error);
    // Make sure to close the connection even if there's an error
    await mongoose.connection.close();
  }
}

// Run the seed function
seedItems();