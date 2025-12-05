const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  resource: {
    type: String,
    required: true // shipments, users, orders, etc.
  },
  action: {
    type: String,
    required: true // create, read, update, delete
  }
}, {
  timestamps: true
});

permissionSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('Permission', permissionSchema);

