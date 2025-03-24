const { Schema, model } = require("mongoose");

const forumTopicSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Topic title is required."],
    },
    content: {
      type: String,
      required: [true, "Topic content is required."],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ForumCategory",
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isAdminPost: {
      type: Boolean,
      default: false,
    },
    hasSpecialReplacements: {
      type: Boolean,
      default: false,
  
  }
},
  {
    timestamps: true,
  }
);

const ForumTopic = model("ForumTopic", forumTopicSchema);

module.exports = ForumTopic;
