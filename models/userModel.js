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
    countryCode: {
      type: String,
      required: true,
    },
    contact: {
      type: Number,  
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
      default: "English", // English as default
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
    role:
    {
      type:String,
      default: 'user',
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };