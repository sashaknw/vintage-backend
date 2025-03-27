const { Schema, model } = require("mongoose");

const moderationDataSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["profanity", "spam", "harassment", "special_replacement"],
      required: true,
    },
    patterns: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    severity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    replacementValue: {
      type: String,
      required: false,
    },
    isRegex: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

moderationDataSchema.index({ type: 1 });

const ModerationData = model("ModerationData", moderationDataSchema);

module.exports = ModerationData;
