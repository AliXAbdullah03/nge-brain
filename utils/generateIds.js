const Shipment = require('../models/Shipment');
const Order = require('../models/Order');

/**
 * Generate unique tracking ID: NGE + 8 digits
 */
async function generateTrackingId() {
  let trackingId;
  let exists = true;
  
  while (exists) {
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    trackingId = `NGE${randomNum}`;
    const shipment = await Shipment.findOne({ trackingId });
    exists = !!shipment;
  }
  
  return trackingId;
}

/**
 * Generate unique order number and tracking ID: NGE + 9 digits
 * Both orderNumber and trackingId use the same value
 * Format: NGE followed by exactly 9 digits (e.g., NGE123456789)
 */
async function generateOrderNumber() {
  let orderNumber;
  let exists = true;
  
  while (exists) {
    // Generate 9-digit number (100000000 to 999999999)
    const randomNum = Math.floor(100000000 + Math.random() * 900000000);
    orderNumber = `NGE${randomNum}`;
    
    // Check if this orderNumber or trackingId already exists
    const existingOrder = await Order.findOne({
      $or: [
        { orderNumber: orderNumber },
        { trackingId: orderNumber }
      ]
    });
    exists = !!existingOrder;
  }
  
  return orderNumber;
}

/**
 * Generate unique tracking ID for orders: NGE + 9 digits
 * This now returns the same value as generateOrderNumber
 * (kept for backward compatibility, but both should use the same value)
 */
async function generateOrderTrackingId() {
  // Use the same generation logic as orderNumber
  return generateOrderNumber();
}

/**
 * Generate batch number: BCH-YYYY-XXX
 */
async function generateBatchNumber() {
  const year = new Date().getFullYear();
  let sequence = 1;
  
  // Find the highest batch number for this year
  const lastBatch = await Shipment.findOne({
    batchNumber: new RegExp(`^BCH-${year}-`)
  }).sort({ batchNumber: -1 });
  
  if (lastBatch && lastBatch.batchNumber) {
    const match = lastBatch.batchNumber.match(/BCH-\d{4}-(\d+)/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }
  
  return `BCH-${year}-${sequence.toString().padStart(3, '0')}`;
}

module.exports = {
  generateTrackingId,
  generateOrderNumber,
  generateOrderTrackingId,
  generateBatchNumber
};

