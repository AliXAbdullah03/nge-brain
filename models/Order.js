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
    trim: true,
    match: [/^NGE\d{9}$/, 'Order number must be in format NGE followed by 9 digits (e.g., NGE123456789)']
  },
  trackingId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^NGE\d{9}$/, 'Tracking ID must be in format NGE followed by 9 digits (e.g., NGE123456789)']
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
    enum: [
      'Shipment Received',
      'Shipment Processing',
      'Departed from Manila',
      'In Transit going to Dubai Airport',
      'Arrived at Dubai Airport',
      'Shipment Clearance',
      'Out for Delivery',
      'Delivered'
    ],
    default: 'Shipment Received'
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
orderSchema.index({ trackingId: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ batchNumber: 1 });
orderSchema.index({ departureDate: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

