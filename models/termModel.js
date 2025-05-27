const mongoose = require("mongoose");

const termSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true, // e.g., "en", "fr", "de"
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Term = mongoose.model('Term', termSchema);
module.exports = { Term };