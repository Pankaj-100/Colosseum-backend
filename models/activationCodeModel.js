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

// Hash the code before saving
ActivationCodeSchema.pre('save', async function (next) {
  if (!this.isModified('code')) return next();
  this.code = await bcrypt.hash(this.code, 8);
  next();
});

// Method to check if code matches
ActivationCodeSchema.methods.verifyCode = async function (candidateCode) {
  return await bcrypt.compare(candidateCode, this.code);
};

module.exports = mongoose.model('ActivationCode', ActivationCodeSchema);