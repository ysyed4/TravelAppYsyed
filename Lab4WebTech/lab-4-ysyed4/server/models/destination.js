const mongoose = require("mongoose");
const destinationSchema = new mongoose.Schema(
  {
    Destination: String,
    Region: String,
    Country: String,
    category: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    currency: String,
    language: String,
    safety: String,
    description: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("Destination", destinationSchema);
