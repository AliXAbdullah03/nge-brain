const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const { generateTrackingId, generateBatchNumber } = require('../utils/generateIds');

/**
 * Get all shipments with pagination and filters
 */
const getShipments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    const trackingId = req.query.trackingId;
    
    const query = {};
    if (req.user?.roleId?.name === 'Driver') {
      // Drivers can only view shipments that are out for delivery
      query.currentStatus = 'Out for Delivery';
    } else if (status) {
      query.currentStatus = status;
    }
    if (trackingId) query.trackingId = trackingId.toUpperCase();
    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const shipments = await Shipment.find(query)
      .populate('shipperId', 'firstName lastName email phone')
      .populate('receiverId', 'firstName lastName email phone')
      .populate('originBranchId', 'name')
      .populate('destinationBranchId', 'name')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Shipment.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        shipments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment by ID or tracking ID
 */
const getShipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by tracking ID
    let shipment = await Shipment.findById(id)
      .populate('shipperId')
      .populate('receiverId')
      .populate('originBranchId')
      .populate('destinationBranchId')
      .populate('orderId')
      .populate({
        path: 'orderIds',
        select: 'orderNumber status customerId departureDate items totalAmount currency paymentStatus notes batchNumber shipmentId',
        populate: {
          path: 'customerId',
          select: 'firstName lastName email phone'
        }
      })
      .populate('createdBy', 'firstName lastName');
    
    if (!shipment) {
      shipment = await Shipment.findOne({ trackingId: id.toUpperCase() })
        .populate('shipperId')
        .populate('receiverId')
        .populate('originBranchId')
        .populate('destinationBranchId')
        .populate('orderId')
        .populate({
          path: 'orderIds',
          select: 'orderNumber status customerId departureDate items totalAmount currency paymentStatus notes batchNumber shipmentId',
          populate: {
            path: 'customerId',
            select: 'firstName lastName email phone'
          }
        })
        .populate('createdBy', 'firstName lastName');
    }
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found'
        }
      });
    }
    
    // Convert to plain object and add orders field (aliased from orderIds)
    const shipmentObj = shipment.toObject();
    shipmentObj.orders = shipmentObj.orderIds || [];
    
    res.json({
      success: true,
      data: shipmentObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track shipment (public endpoint)
 */
const trackShipment = async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    
    const shipment = await Shipment.findOne({ trackingId: trackingId.toUpperCase() })
      .populate('shipperId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .populate('originBranchId', 'name address')
      .populate('destinationBranchId', 'name address');
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        shipment: {
          trackingId: shipment.trackingId,
          currentStatus: shipment.currentStatus,
          originBranch: shipment.originBranchId,
          destinationBranch: shipment.destinationBranchId,
          estimatedDeliveryDate: shipment.estimatedDeliveryDate,
          createdAt: shipment.createdAt
        },
        history: shipment.history,
        parcels: shipment.parcels
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new shipment
 */
const createShipment = async (req, res, next) => {
  try {
    const trackingId = await generateTrackingId();
    const batchNumber = req.body.batchNumber || await generateBatchNumber();
    
    // Calculate total weight
    const totalWeight = req.body.parcels.reduce((sum, parcel) => sum + (parcel.weight || 0), 0);
    
    const shipmentData = {
      trackingId,
      orderId: req.body.orderId,
      shipperId: req.body.shipperId,
      receiverId: req.body.receiverId,
      invoiceNumber: req.body.invoiceNumber,
      batchNumber,
      departureDate: req.body.departureDate,
      estimatedDeliveryDate: req.body.estimatedDeliveryDate,
      originBranchId: req.body.originBranchId,
      destinationBranchId: req.body.destinationBranchId,
      parcels: req.body.parcels,
      totalWeight,
      weightUnit: req.body.weightUnit || 'kg',
      shippingCost: req.body.shippingCost || 0,
      insuranceAmount: req.body.insuranceAmount || 0,
      createdBy: req.user._id,
      history: [{
        status: 'Processing',
        location: req.body.originBranchId ? 'Origin Facility' : 'Processing Center',
        notes: 'Shipment created',
        date: new Date(),
        createdBy: req.user._id
      }]
    };
    
    const shipment = new Shipment(shipmentData);
    await shipment.save();
    
    await shipment.populate('shipperId receiverId originBranchId destinationBranchId orderId createdBy');
    
    res.status(201).json({
      success: true,
      data: { shipment },
      message: 'Shipment created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment
 */
const normalizeShipmentStatus = (status) => {
  if (!status) return undefined;
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'in_transit':
      return 'In Transit';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'completed':
      return 'Completed';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    case 'on_hold':
      return 'On Hold';
    case 'confirmed':
      return 'Confirmed';
    default:
      return 'Processing';
  }
};

const mapShipmentStatusToOrderStatus = (status) => {
  if (!status) return undefined;
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  switch (normalized) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'in_transit':
      return 'in_transit';
    case 'out_for_delivery':
      return 'in_transit';
    case 'delivered':
      return 'delivered';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'on_hold':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    default:
      return 'processing';
  }
};

const updateShipment = async (req, res, next) => {
  try {
    const { status, notes, location } = req.body;
    if (req.user?.roleId?.name === 'Driver') {
      if (status && normalizeShipmentStatus(status) !== 'Delivered') {
        return res.status(403).json({
          success: false,
          error: { code: 'PERMISSION_DENIED', message: 'Drivers can only mark Delivered' }
        });
      }
    }

    const normalizedStatus = normalizeShipmentStatus(status);

    const setPayload = {
      ...req.body,
      ...(normalizedStatus ? { currentStatus: normalizedStatus } : {}),
      updatedAt: new Date()
    };

    const historyEntry = status
      ? {
          status: normalizedStatus,
          location: location || 'N/A',
          notes: notes || '',
          date: new Date(),
          createdBy: req.user ? req.user._id : undefined
        }
      : null;

    const update = historyEntry
      ? { $set: setPayload, $push: { history: historyEntry } }
      : { $set: setPayload };

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate('shipperId receiverId originBranchId destinationBranchId orderId orderIds createdBy');
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found'
        }
      });
    }

    // If status updated, propagate to related orders
    if (status) {
      const orderIds = [];
      if (shipment.orderId) orderIds.push(shipment.orderId);
      if (Array.isArray(shipment.orderIds) && shipment.orderIds.length) {
        orderIds.push(...shipment.orderIds);
      }

      if (orderIds.length) {
        const orderStatus = mapShipmentStatusToOrderStatus(status);
        await Order.updateMany(
          { _id: { $in: orderIds } },
          { $set: { status: orderStatus } }
        );
      }
    }
    
    res.json({
      success: true,
      data: { shipment },
      message: 'Shipment updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment status and add to history
 */
const updateShipmentStatus = async (req, res, next) => {
  try {
    const { status, location, notes } = req.body;
    if (req.user?.roleId?.name === 'Driver') {
      if (status && normalizeShipmentStatus(status) !== 'Delivered') {
        return res.status(403).json({
          success: false,
          error: { code: 'PERMISSION_DENIED', message: 'Drivers can only mark Delivered' }
        });
      }
    }
    
    const shipment = await Shipment.findById(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found'
        }
      });
    }
    
    // Update status
    shipment.currentStatus = status;
    
    // Add to history
    shipment.history.push({
      status,
      location: location || 'N/A',
      notes: notes || '',
      date: new Date(),
      createdBy: req.user._id
    });
    
    await shipment.save();
    await shipment.populate('shipperId receiverId originBranchId destinationBranchId orderId createdBy');
    
    res.json({
      success: true,
      data: { shipment },
      message: 'Shipment status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete shipment
 */
const deleteShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Shipment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update status for multiple shipments
 */
const updateBulkStatus = async (req, res, next) => {
  try {
    const { shipmentIds, status, location, notes } = req.body;
    
    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'shipmentIds must be a non-empty array'
        }
      });
    }
    
    if (!status || !location) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'status and location are required'
        }
      });
    }
    
    const shipments = await Shipment.find({ _id: { $in: shipmentIds } });
    
    if (shipments.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No shipments found'
        }
      });
    }
    
    // Update all shipments
    const updatePromises = shipments.map(shipment => {
      shipment.currentStatus = status;
      shipment.history.push({
        status,
        location,
        notes: notes || `Bulk status updated`,
        date: new Date(),
        createdBy: req.user._id
      });
      return shipment.save();
    });
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      data: {
        updatedCount: shipments.length
      },
      message: `Status updated for ${shipments.length} shipment(s)`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipments by batch number
 */
const getShipmentsByBatch = async (req, res, next) => {
  try {
    const { batchNumber } = req.params;
    
    const shipments = await Shipment.find({ batchNumber })
      .populate('shipperId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { shipments }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update status for all shipments in a batch
 */
const updateBatchStatus = async (req, res, next) => {
  try {
    const { batchNumber } = req.params;
    const { status, location, notes } = req.body;
    
    const normalizedStatus = normalizeShipmentStatus(status);
    if (req.user?.roleId?.name === 'Driver') {
      if (normalizedStatus !== 'Delivered') {
        return res.status(403).json({
          success: false,
          error: { code: 'PERMISSION_DENIED', message: 'Drivers can only mark Delivered' }
        });
      }
    }
    
    const shipments = await Shipment.find({ batchNumber });
    
    if (shipments.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No shipments found for this batch'
        }
      });
    }
    
    const allOrderIds = [];
    
    // Update all shipments in batch
    const updatePromises = shipments.map(shipment => {
      shipment.currentStatus = normalizedStatus;
      if (shipment.orderId) allOrderIds.push(shipment.orderId);
      if (Array.isArray(shipment.orderIds) && shipment.orderIds.length) {
        allOrderIds.push(...shipment.orderIds);
      }
      shipment.history.push({
        status: normalizedStatus,
        location: location || 'N/A',
        notes: notes || `Batch status updated`,
        date: new Date(),
        createdBy: req.user._id
      });
      return shipment.save();
    });
    
    await Promise.all(updatePromises);

    if (allOrderIds.length && normalizedStatus) {
      const orderStatus = mapShipmentStatusToOrderStatus(normalizedStatus);
      if (orderStatus) {
        await Order.updateMany(
          { _id: { $in: allOrderIds } },
          { $set: { status: orderStatus } }
        );
      }
    }
    
    res.json({
      success: true,
      data: {
        updatedCount: shipments.length
      },
      message: `Batch status updated for ${shipments.length} shipment(s)`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create shipments from multiple orders
 */
const createShipmentsFromOrders = async (req, res, next) => {
  try {
    const { orderIds, departureDate } = req.body;
    
    // Validate input
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'orderIds must be a non-empty array'
        }
      });
    }
    
    // Fetch all orders
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('customerId', 'firstName lastName email phone address city country');
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No orders found with the provided IDs'
        }
      });
    }
    
    if (orders.length !== orderIds.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some order IDs were not found'
        }
      });
    }

    // Determine effective departure date from DB (or provided override)
    let effectiveDepartureDate = departureDate ? new Date(departureDate) : orders[0].departureDate;
    if (!effectiveDepartureDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'departureDate is required (in request or on orders)'
        }
      });
    }
    // Ensure all orders share the same departure date (date-only)
    const dateKey = new Date(effectiveDepartureDate).toISOString().split('T')[0];
    for (const order of orders) {
      if (!order.departureDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Order ${order._id} is missing departureDate`
          }
        });
      }
      const orderKey = new Date(order.departureDate).toISOString().split('T')[0];
      if (orderKey !== dateKey) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All orders must have the same departureDate'
          }
        });
      }
    }

    const dayStart = new Date(effectiveDepartureDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Find existing shipments for this departure date (idempotent)
  const shipmentsSameDate = await Shipment.find({
    departureDate: { $gte: dayStart, $lt: dayEnd }
  }).sort({ createdAt: 1 });

  let shipment = shipmentsSameDate[0];

  if (!shipment) {
    const batchNumber = await generateBatchNumber();
    const trackingId = await generateTrackingId();
    const firstOrder = orders[0];

    shipment = await Shipment.create({
      trackingId,
      batchNumber,
      departureDate: dayStart,
      orderIds: [],
      shipperId: firstOrder.customerId._id,
      receiverId: firstOrder.customerId._id,
      originBranchId: firstOrder.branchId || null,
      destinationBranchId: null,
      parcels: [],
      totalWeight: 0,
      weightUnit: 'kg',
      shippingCost: firstOrder.totalAmount || 0,
      insuranceAmount: 0,
      createdBy: req.user._id,
      history: [{
        status: 'Processing',
        location: firstOrder.branchId ? 'Origin Facility' : 'Processing Center',
        notes: `Shipment batch created for ${dateKey}`,
        date: new Date(),
        createdBy: req.user._id
      }]
    });
  } else if (shipmentsSameDate.length > 1) {
    // Merge duplicate shipments for the same date into the first one
    const duplicates = shipmentsSameDate.slice(1);
    const duplicateIds = duplicates.map((s) => s._id);
    const duplicateOrderIds = duplicates.flatMap((s) => s.orderIds || []);

    if (duplicateOrderIds.length) {
      await Shipment.updateOne(
        { _id: shipment._id },
        { $addToSet: { orderIds: { $each: duplicateOrderIds } } }
      );
    }

    await Order.updateMany(
      { shipmentId: { $in: duplicateIds } },
      { $set: { shipmentId: shipment._id, batchNumber: shipment.batchNumber } }
    );

    await Shipment.deleteMany({ _id: { $in: duplicateIds } });
  }

  const orderIdsToAdd = orders.map((o) => o._id);

  await Shipment.updateOne(
    { _id: shipment._id },
    { $addToSet: { orderIds: { $each: orderIdsToAdd } } }
  );

  await Order.updateMany(
    { _id: { $in: orderIdsToAdd } },
    { $set: { shipmentId: shipment._id, batchNumber: shipment.batchNumber } }
  );

  const populatedShipment = await Shipment.findById(shipment._id)
    .populate('shipperId receiverId originBranchId destinationBranchId orderIds createdBy');

  res.status(201).json({
    success: true,
    data: {
      shipment: populatedShipment,
      batchNumber: populatedShipment.batchNumber,
      count: populatedShipment.orderIds.length
    },
    message: 'Shipment created/updated from orders (idempotent per departure date)'
  });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShipments,
  getShipmentById,
  trackShipment,
  createShipment,
  createShipmentsFromOrders,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
  getShipmentsByBatch,
  updateBatchStatus,
  updateBulkStatus
};

