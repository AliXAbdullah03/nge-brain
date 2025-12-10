require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const { generateTrackingId, generateBatchNumber } = require('../utils/generateIds');

/**
 * Auto-batch orders into shipments grouped by departure date.
 *
 * Usage:
 *   MONGODB_URI="mongodb://..." node scripts/auto-batch-shipments.js
 *   (or schedule via cron/PM2)
 *
 * Behaviour:
 *   - Finds orders with a departureDate and without a shipment assigned.
 *   - Groups them by departure date (YYYY-MM-DD).
 *   - Creates one shipment per departure date.
 *   - Assigns grouped orders to that shipment (sets shipmentId + batchNumber).
 */
async function run() {
  await connectDB();

  const unbatchedOrders = await Order.find({
    departureDate: { $exists: true, $ne: null },
    $or: [{ shipmentId: { $exists: false } }, { shipmentId: null }]
  }).lean();

  if (!unbatchedOrders.length) {
    console.log('No unbatched orders found. Nothing to do.');
    return;
  }

  const groups = {};
  for (const order of unbatchedOrders) {
    const key = new Date(order.departureDate).toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(order);
  }

  for (const [dateKey, ordersForDate] of Object.entries(groups)) {
    const orderIds = ordersForDate.map((o) => o._id);
    const dayStart = new Date(dateKey);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Fetch any shipments already on this date; merge duplicates into one.
    const shipmentsSameDate = await Shipment.find({
      departureDate: { $gte: dayStart, $lt: dayEnd }
    }).sort({ createdAt: 1 });

    let shipment = shipmentsSameDate[0];

    if (!shipment) {
      const batchNumber = await generateBatchNumber();
      const trackingId = await generateTrackingId();
      // Use the first order's customer as shipper/receiver fallback to satisfy schema requirements.
      const firstCustomerId = ordersForDate[0].customerId;

      shipment = await Shipment.create({
        trackingId,
        batchNumber,
        departureDate: dayStart,
        orderIds,
        shipperId: firstCustomerId,
        receiverId: firstCustomerId,
        currentStatus: 'Processing',
        history: [
          {
            status: 'Processing',
            location: 'Auto-batch job',
            notes: `Batch created for ${dateKey}`,
            date: new Date()
          }
        ]
      });
    } else {
      // If multiple shipments exist for the same date, merge them into the first.
      if (shipmentsSameDate.length > 1) {
        const duplicates = shipmentsSameDate.slice(1);
        const duplicateIds = duplicates.map((s) => s._id);
        const duplicateOrderIds = duplicates.flatMap((s) => s.orderIds || []);

        // Move orders from duplicate shipments to the primary shipment
        if (duplicateOrderIds.length) {
          await Shipment.updateOne(
            { _id: shipment._id },
            { $addToSet: { orderIds: { $each: duplicateOrderIds } } }
          );
        }

        // Point any orders referencing duplicate shipments to the primary shipment
        await Order.updateMany(
          { shipmentId: { $in: duplicateIds } },
          { $set: { shipmentId: shipment._id, batchNumber: shipment.batchNumber } }
        );

        // Remove duplicate shipment documents
        await Shipment.deleteMany({ _id: { $in: duplicateIds } });
      }

      // Add any new orders to the existing shipment (avoid duplicates).
      await Shipment.updateOne(
        { _id: shipment._id },
        { $addToSet: { orderIds: { $each: orderIds } } }
      );
    }

    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { shipmentId: shipment._id, batchNumber: shipment.batchNumber } }
    );

    console.log(
      `Updated shipment ${shipment._id} for ${dateKey} with ${orderIds.length} order(s)`
    );
  }
}

run()
  .then(async () => {
    console.log('Auto-batching complete');
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Auto-batching failed', err);
    await mongoose.connection.close();
    process.exit(1);
  });


