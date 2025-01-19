const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Review", reviewSchema);
