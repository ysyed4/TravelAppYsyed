const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    nickname: {
      type: String,
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    roles: {
      type: [String],
      default: ["user"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
