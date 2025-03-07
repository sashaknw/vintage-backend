
const { Schema, model } = require("mongoose");

const favoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ user: 1, item: 1 }, { unique: true });

const Favorite = model("Favorite", favoriteSchema);

module.exports = Favorite;
