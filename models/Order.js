const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: false,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false
  },
  departureDate: {
    type: Date
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: false,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  batchNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'in_transit', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

