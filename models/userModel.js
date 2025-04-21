const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
   phone: {
    type: String,
    required: true,
    unique: true,

  },
    password: {
      type: String,
      required: true,
    },
    preferredLanguage: {
      type: String,
      required: true,
      default: "English",
    },
    verified: {
      type: Boolean,
      required: true,
      default: false
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    role: {
      type: String,
      default: 'user',
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };