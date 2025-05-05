const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      unique: true
    },
    thumbnailUrl: {
      type: String,
      required: [true, "Thumbnail URL is required"],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Location = mongoose.model("Location", locationSchema);
module.exports = Location;
