const mongoose = require("mongoose");

const InstagramAccountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lastScraped: {
      type: Date,
      default: null,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastPosts: [
      {
        url: String,
        date: Date,
        caption: String,
        imageUrl: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstagramAccount", InstagramAccountSchema);
