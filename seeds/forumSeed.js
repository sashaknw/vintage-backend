
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const User = require("../models/User.model");
const ForumCategory = require("../models/ForumCategory.model");
const ForumTopic = require("../models/ForumTopic.model");
const ForumReply = require("../models/ForumReply.model");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vintage-backend";

async function seedForum() {
  try {
  
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding");

    // Clear existing forum data
    await ForumReply.deleteMany({});
    await ForumTopic.deleteMany({});
    await ForumCategory.deleteMany({});

    // Create admin user if not exists
    let adminUser = await User.findOne({ email: "admin@vintagevault.com" });

    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin123", salt);

      adminUser = await User.create({
        name: "VintageVault Admin",
        email: "admin@vintagevault.com",
        password: hashedPassword,
      });

      console.log("Admin user created");
    }

 
    const categories = await ForumCategory.create([
      {
        name: "Pop-up Markets & Events",
        description:
          "Discussions about local pop-up markets, vintage fairs, and community events",
        icon: "🎪",
        order: 1,
      },
      {
        name: "Upcycling Projects",
        description:
          "Share your upcycling ideas, progress, and completed transformations",
        icon: "✂️",
        order: 2,
      },
      {
        name: "Shop Announcements",
        description:
          "Official announcements from Vintage Vault about new collections, promotions, and updates",
        icon: "📢",
        order: 3,
      },
    ]);

    console.log("Categories created:", categories.length);

    //  sample topics and replies
    // Pop-up Markets & Events
    const marketsTopic1 = await ForumTopic.create({
      title: "Monthly Vintage Market - First Sunday of Each Month",
      content:
        "We're excited to announce that V-Vault will be participating in the Monthly Vintage Market held at the Port Park on the first Sunday of each month from 10:00 to 16:00. Come visit our stall for exclusive items that aren't available in our main shop!\n\nThe market features over 30 vintage and second-hand vendors, food trucks, and live music. It's a great opportunity to connect with fellow vintage enthusiasts and discover unique pieces.\n\nWill you be joining us this Sunday?",
      author: adminUser._id,
      category: categories[0]._id,
      isPinned: true,
      followers: [adminUser._id],
      lastActivity: new Date(),
    });

    await ForumReply.create({
      content:
        "awesome market! Looking forward to seeing you guys there!\n\n",
      author: adminUser._id,
      topic: marketsTopic1._id,
    });

    const marketsTopic2 = await ForumTopic.create({
      title: "Sustainable Fashion Workshop - March 15th",
      content:
        "We're collaborating with local designers to host a Sustainable Fashion Workshop on March 15th from 14:00 to 17:00 at our shop. Learn about sustainable fashion practices, fabric selection, and basic sewing techniques for extending the life of your clothes.\n\nThe workshop costs €15 per person, with all materials provided. Space is limited to 15 participants, so book your spot early by calling us or sending an email to workshop@vintagevault.com.",
      author: adminUser._id,
      category: categories[0]._id,
      followers: [adminUser._id],
      lastActivity: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    });

    // Upcycling Projects
    const upcyclingTopic1 = await ForumTopic.create({
      title: "From Old Jeans to Stylish Tote Bag - Step by Step Guide",
      content:
        "Hi everyone! I wanted to share a recent upcycling project where I transformed an old pair of my father's jeans into a practical and stylish tote bag.\n\n**Materials needed:**\n- Old pair of jeans\n- Scissors\n- Sewing machine (or needle and thread)\n- Measuring tape\n- Pins\n- Iron\n\n**Steps:**\n1. Cut the legs off the jeans just below the pockets\n2. Turn the top part inside out\n3. Sew the bottom closed with a straight stitch\n4. Turn right side out and iron the seams\n5. For straps, I used the leg material cut into strips\n6. Attach straps securely to the top of the bag\n\nThe whole project took about 2 hours and now I have a unique bag that's much more durable than store-bought totes!\n\nHas anyone else tried making bags from old jeans?",
      author: adminUser._id,
      category: categories[1]._id,
      followers: [adminUser._id],
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });

    await ForumReply.create({
      content:
        "This is such a great idea! I've been looking for something to do with my old jeans that no longer fit. Do you think it would work with stretchy jeans too or are the regular denim ones better for this project?",
      author: adminUser._id,
      topic: upcyclingTopic1._id,
    });

    const upcyclingTopic2 = await ForumTopic.create({
      title: "Button Jewelry from Vintage Shirts",
      content:
        "Don't throw away those beautiful buttons from vintage shirts that are beyond repair! I've been making jewelry from vintage buttons and wanted to share some ideas:\n\n1. **Button Bracelets**: String buttons on elastic cord for quick bracelets\n2. **Button Earrings**: Attach small, matching buttons to earring findings\n3. **Button Necklaces**: Mix different sizes and colors on a chain\n\nThe best part is these projects require minimal supplies and are perfect for beginners. I'll post some photos of my creations soon!\n\nWhat creative uses have you found for old buttons?",
      author: adminUser._id,
      category: categories[1]._id,
      followers: [adminUser._id],
      lastActivity: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
    });

    // Shop Announcements
    const announcementTopic1 = await ForumTopic.create({
      title: "Spring Collection Arriving Next Week!",
      content:
        "We're thrilled to announce that our Spring 2025 collection will be hitting the shelves next Tuesday, March 18th!\n\nThis collection features beautiful floral dresses from the 70s, lightweight jackets from the 90s, and a wide selection of vintage accessories perfect for the warmer months ahead.\n\nAs always, our community members get first access - we'll be opening an hour early (9am) on Tuesday exclusively for our regular customers before general opening at 10am.\n\nWe can't wait to see you there!",
      author: adminUser._id,
      category: categories[2]._id,
      isPinned: true,
      followers: [adminUser._id],
      lastActivity: new Date(),
    });

    await ForumReply.create({
      content:
        "I'm so excited for the new collection! The 70s floral dresses sound amazing. Will definitely be there at 9am sharp!",
      author: adminUser._id,
      topic: announcementTopic1._id,
    });

    const announcementTopic2 = await ForumTopic.create({
      title: "Shop Closed on Tuesday, April 2nd for Inventory",
      content:
        "Please note that ReWear Boutique will be closed on Tuesday, April 2nd for our quarterly inventory check.\n\nWe'll resume normal business hours on Wednesday, April 3rd at 10:00.\n\nThank you for your understanding, and we apologize for any inconvenience this might cause.",
      author: adminUser._id,
      category: categories[2]._id,
      followers: [adminUser._id],
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });

    console.log("Sample topics and replies created");
    console.log("Forum seeding completed successfully");
  } catch (error) {
    console.error("Error seeding forum data:", error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seed function
seedForum();
