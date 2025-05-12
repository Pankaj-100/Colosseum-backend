const mongoose = require('mongoose');

const ActivationCodeSchema = new mongoose.Schema({
  hashedCode: {
    type: String,
    required: true,
    unique: true
  },
  encryptedCode: {
    type: String,
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTill: {
    type: Date,
    required: true
  },
  activations: [{
    deviceId: {
      type: String,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    activatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});


const ActivationCode = mongoose.model('ActivationCode', ActivationCodeSchema);
module.exports = ActivationCode;
