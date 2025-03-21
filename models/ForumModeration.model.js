
const { Schema, model } = require("mongoose");

const forumModerationSchema = new Schema(
  {
    contentType: {
      type: String,
      enum: ["topic", "reply"],
      required: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "contentType",
    },
    originalContent: {
      type: String,
      required: true,
    },
    moderationScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    issues: [
      {
        type: {
          type: String,
          enum: [
            "profanity",
            "spam",
            "harassment",
            "promotional",
            "off-topic",
            "scam",
            "other",
          ],
        },
        severity: {
          type: Number,
          min: 0,
          max: 1,
        },
        explanation: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "modified"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNote: String,
    suggestedImprovement: String,
  },
  {
    timestamps: true,
  }
);

//what needs to b reviewed
forumModerationSchema.statics.findPendingReviews = function () {
  return this.find({ status: "pending" }).sort({
    moderationScore: -1,
    createdAt: -1,
  });
};

// find recent moderation 
forumModerationSchema.statics.findRecentActivity = function (limit = 10) {
  return this.find()
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate("reviewedBy", "name");
};

const ForumModeration = model("ForumModeration", forumModerationSchema);

module.exports = ForumModeration;
