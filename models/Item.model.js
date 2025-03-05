const { Schema, model } = require("mongoose");

const itemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    size: {
      type: String,
      required: [true, "Size is required"],
      enum: ["XS", "S", "M", "L", "XL", "XXL", "One Size"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["tops", "bottoms", "dresses", "outerwear", "accessories", "shoes"],
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: ["Mint", "Good", "Rugged"],
    },
    era: {
      type: String,
      enum: ["50s", "60s", "70s", "80s", "90s", "y2k"],
    },
    brand: String,
    images: [String],
    inStock: {
      type: Boolean,
      default: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Item = model("Item", itemSchema);

module.exports = Item;
