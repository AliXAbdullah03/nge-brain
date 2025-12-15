const mongoose = require('mongoose');

const hubInformationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  operatingDays: {
    type: String,
    trim: true
  },
  operatingTime: {
    type: String, // "9 AM - 6 PM"
    trim: true
  },
  timeZone: {
    type: String, // "UAE Time Zone"
    trim: true
  },
  timeZoneOffset: {
    type: String, // "GMT+4"
    trim: true
  },
  mapEmbedUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
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

hubInformationSchema.index({ code: 1 });
hubInformationSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('HubInformation', hubInformationSchema);

