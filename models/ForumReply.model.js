
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
  },
  {
    timestamps: true,
  }
);

const ForumReply = model("ForumReply", forumReplySchema);

module.exports = ForumReply;
