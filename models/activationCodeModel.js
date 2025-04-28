// models/ActivationCode.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ActivationCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deviceId: {  // Track which device used this code
    type: String,
  },
  usedAt: {
    type: Date,
  },
  expiresAt: {  // 48 hours from first use
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});


const ActivationCode = mongoose.model("ActivationCode", ActivationCodeSchema);

module.exports = { ActivationCode };