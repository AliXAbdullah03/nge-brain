const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: String
  },
  type: {
    type: String,
    enum: ['text', 'email', 'url', 'json'],
    default: 'text'
  },
  category: {
    type: String,
    enum: ['general', 'contact', 'social'],
    default: 'general'
  }
}, {
  timestamps: { createdAt: false, updatedAt: true }
});

siteSettingSchema.index({ key: 1 });
siteSettingSchema.index({ category: 1 });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);

