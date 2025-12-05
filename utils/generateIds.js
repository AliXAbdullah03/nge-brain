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
 * Generate unique order number: ORD- + 4 digits
 */
async function generateOrderNumber() {
  let orderNumber;
  let exists = true;
  let sequence = 1001;
  
  // Find the highest order number
  const lastOrder = await Order.findOne().sort({ orderNumber: -1 });
  if (lastOrder && lastOrder.orderNumber) {
    const lastNum = parseInt(lastOrder.orderNumber.replace('ORD-', ''));
    if (!isNaN(lastNum)) {
      sequence = lastNum + 1;
    }
  }
  
  while (exists) {
    orderNumber = `ORD-${sequence.toString().padStart(4, '0')}`;
    const order = await Order.findOne({ orderNumber });
    exists = !!order;
    if (exists) sequence++;
  }
  
  return orderNumber;
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
  generateBatchNumber
};

