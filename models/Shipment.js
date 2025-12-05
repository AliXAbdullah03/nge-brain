const mongoose = require('mongoose');

const shipmentHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const parcelSchema = new mongoose.Schema({
  itemsDescription: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  weightUnit: {
    type: String,
    default: 'kg'
  },
  dimensions: {
    type: String // "LxWxH"
  },
  value: {
    type: Number,
    min: 0
  }
}, { _id: true });

const shipmentSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  shipperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  departureDate: {
    type: Date
  },
  estimatedDeliveryDate: {
    type: Date
  },
  currentStatus: {
    type: String,
    enum: ['Processing', 'In Transit', 'Out for Delivery', 'Delivered', 'On Hold'],
    default: 'Processing'
  },
  originBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  destinationBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  parcels: [parcelSchema],
  history: [shipmentHistorySchema],
  totalWeight: {
    type: Number,
    min: 0
  },
  weightUnit: {
    type: String,
    default: 'kg'
  },
  shippingCost: {
    type: Number,
    min: 0
  },
  insuranceAmount: {
    type: Number,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
shipmentSchema.index({ trackingId: 1 });
shipmentSchema.index({ currentStatus: 1 });
shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ batchNumber: 1 });
shipmentSchema.index({ shipperId: 1 });
shipmentSchema.index({ receiverId: 1 });
shipmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);

