
const { Schema, model } = require("mongoose");

const forumCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Category description is required."],
    },
    icon: {
      type: String,
      default: "💬",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ForumCategory = model("ForumCategory", forumCategorySchema);

module.exports = ForumCategory;

