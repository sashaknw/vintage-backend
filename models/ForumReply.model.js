const { Schema, model } = require("mongoose");

const forumReplySchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Reply content is required."],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: Schema.Types.ObjectId,
      ref: "ForumTopic",
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isAdminReply: {
      type: Boolean,
      default: false,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    pendingModeration: {
      type: Boolean,
      default: false,
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "none"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

const ForumReply = model("ForumReply", forumReplySchema);

module.exports = ForumReply;
