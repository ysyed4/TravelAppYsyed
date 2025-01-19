const mongoose = require("mongoose");

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    destinations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Destination",
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("List", listSchema);
