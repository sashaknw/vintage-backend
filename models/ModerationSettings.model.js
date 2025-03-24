const { Schema, model } = require("mongoose");

const moderationSettingsSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    autoModerateSafe: {
      type: Boolean,
      default: true,
    },
    autoRemoveHighRisk: {
      type: Boolean,
      default: false,
    },
    toxicityThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
    },
  },
  {
    timestamps: true,
  }
);

const ModerationSettings = model(
  "ModerationSettings",
  moderationSettingsSchema
);
module.exports = ModerationSettings;
