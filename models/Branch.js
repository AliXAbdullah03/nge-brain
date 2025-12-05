const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  postalCode: {
    type: String
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
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Branch', branchSchema);

