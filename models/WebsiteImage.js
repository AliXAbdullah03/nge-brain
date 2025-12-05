const mongoose = require('mongoose');

const websiteImageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  storagePath: {
    type: String // S3 path or local path
  },
  imageType: {
    type: String,
    enum: ['hero', 'service', 'testimonial', 'other'],
    default: 'hero'
  },
  altText: {
    type: String
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

websiteImageSchema.index({ imageType: 1, isActive: 1 });
websiteImageSchema.index({ orderIndex: 1 });

module.exports = mongoose.model('WebsiteImage', websiteImageSchema);

