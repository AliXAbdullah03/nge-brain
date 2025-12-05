const mongoose = require('mongoose');

const hubInformationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true
  },
  phone: {
    type: String
  },
  operatingTime: {
    type: String // "9 AM - 6 PM"
  },
  timeZone: {
    type: String // "UAE Time Zone (GMT+4)"
  },
  mapUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

hubInformationSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('HubInformation', hubInformationSchema);

