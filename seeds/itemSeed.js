require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Item = require("../models/Item.model");

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

    // Sample item data with multiple images
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
        brand: "Maverick",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741184762/denim-jacket-view1_kgvsi0.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741184762/denim-jacket-view2_ytg2hm.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741184762/denim-jacket-view4_vxhjb4.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741184762/denim-jacket-view3_wu5xkj.webp",
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
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741187516/mom-jeans-view1_adn4sk.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741187517/mom-jeans-view2_mcnu9s.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741187517/mom-jeans-view3_dlhka9.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741187517/mom-jeans-view4_yiifal.webp",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Raver glasses",
        description: "Unbranded mad eyewear in blue .",
        price: 5.0,
        size: "One Size",
        category: "accessories",
        condition: "Mint",
        era: "y2k",
        brand: "Unknown",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190017/sunglasses-view2_fnpzjp.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190017/sunglasses-view1_tor4hj.webp",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Grunge Flannel Shirt",
        description:
          "Classic oversized flannel shirt in a vibrant red and black plaid, perfect for channeling 90s alternative rock vibes.",
        price: 45.0,
        size: "XL",
        category: "tops",
        condition: "Good",
        era: "90s",
        brand: "Field & Stream",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189612/grunge-shirt-view1_drabjf.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189643/grunge-shirt-view2_w02r7m.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189644/grunge-shirt-view3_wofvfb.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189644/grunge-shirt-view4_gelfiw.webp",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Patterned Evening Dress",
        description:
          "Brocade red & gold patterned evening dress with cheongsam collar.",
        price: 120.0,
        size: "M",
        category: "dresses",
        condition: "Mint",
        era: "70s",
        brand: "Brocade",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741188765/red-evening-dress-view1_og7grx.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741188766/red-evening-dress-view2_vgbkew.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741188766/red-evening-dress-view3_cta5of.webp",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Leather Patchwork on Denim Jacket",
        description:
          "This super 70s cropped denim jacket flexes multicolour leather patchwork and reverse leather cuffs. ",
        price: 88.0,
        size: "M",
        category: "outerwear",
        condition: "Good",
        era: "70s",
        brand: "aura",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189005/patchwork-leather-view1_c7mtnf.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189005/patchwork-leather-view2_ycay3s.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189006/patchwork-leather-view3_r85bdo.jpg",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189006/patchwork-leather-view4_obioqw.jpg",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Sequined Mini Dress",
        description:
          "Vibrant floral print mini dress embodying the bold spirit of 1960s fashion.",
        price: 95.0,
        size: "S",
        category: "dresses",
        condition: "Good",
        era: "60s",
        brand: "Mary Quant",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189397/sequined-mini-view1_v8obqo.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189397/sequined-mini-view2_ljgsxn.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741189398/sequined-mini-view3_svdg1i.webp",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Black Leather Shoes",
        description: "Authentic leather Richmond's in UK 6.5 size.",
        price: 55.0,
        size: "L",
        category: "shoes",
        condition: "Rugged",
        era: "80s",
        brand: "Richmond",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190254/black-shoes-view1_uylzh2.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190256/black-shoes-view2_pxos1y.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190256/black-shoes-view3_exp76s.webp",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Turquoise Prom Dress",
        description:
          "Maxi evening dress from the 1980s in turquoise with a pussy bow and puff sleeves. Stain on hem but otherwise in good condition.",
        price: 85.0,
        size: "S",
        category: "dresses",
        condition: "Good",
        era: "80s",
        brand: "Unknown",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190531/eighties-dress-view1_sfh2yn.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190532/eighties-dress-view2_ywk2vz.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741190533/eighties-dress-view3_tqbtrk.webp",
        ],
        inStock: true,
        seller: seller._id,
      },
      {
        name: "Checked Blazer",
        description:
          "Classic checked blazer made out of 100% wool, timeless and versatile.",
        price: 110.0,
        size: "XL",
        category: "outerwear",
        condition: "Good",
        era: "90s",
        brand: "Burberry",
        images: [
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741188072/blazer-burbery-view1_uu9zjx.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741188073/blazer-burbery-view2_ocu7oa.webp",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741188073/blazer-burbery-view4_e6kf2i.jpg",
          "https://res.cloudinary.com/dlkmeyasv/image/upload/v1741188072/blazer-burbery-view3_whqmhs.jpg",
        ],
        inStock: true,
        seller: seller._id,
      },
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
