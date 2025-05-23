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
    match: [/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format"],
  },
    password: {
      type: String,
      required: true,
    },
    preferredLanguage: {
      type: String,
      required: true,
    //  enum: ['English', 'Spanish', 'French', 'German', 'Italian','Arabic','Chinese','Japanese','korean'], 
      default: 'English'
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
    },
    profileImage: {
      type: String,
      default: null
    },
    resetPasswordOTP: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },

  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };