const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['Driver', 'Super Admin', 'Admin', 'Hub Receiver']
  },
  description: {
    type: String
  },
  // Support both string array and ObjectId array for backward compatibility
  permissions: [{
    type: String
  }],
  permissionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }]
}, {
  timestamps: true
});

roleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', roleSchema);

