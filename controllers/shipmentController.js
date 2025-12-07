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
    if (status) query.currentStatus = status;
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
      .populate('createdBy', 'firstName lastName');
    
    if (!shipment) {
      shipment = await Shipment.findOne({ trackingId: id.toUpperCase() })
        .populate('shipperId')
        .populate('receiverId')
        .populate('originBranchId')
        .populate('destinationBranchId')
        .populate('orderId')
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
    
    res.json({
      success: true,
      data: {
        shipment,
        history: shipment.history,
        parcels: shipment.parcels
      }
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
const updateShipment = async (req, res, next) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('shipperId receiverId originBranchId destinationBranchId orderId createdBy');
    
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
      location,
      notes,
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
    
    // Update all shipments in batch
    const updatePromises = shipments.map(shipment => {
      shipment.currentStatus = status;
      shipment.history.push({
        status,
        location,
        notes: notes || `Batch status updated`,
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
    
    if (!departureDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'departureDate is required'
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
    
    // Generate a batch number for all shipments
    const batchNumber = await generateBatchNumber();
    const createdShipments = [];
    
    // Create a shipment for each order
    for (const order of orders) {
      const trackingId = await generateTrackingId();
      
      // Convert order items to parcels
      const parcels = order.items.map(item => ({
        itemsDescription: item.description,
        weight: 0, // Default weight, can be updated later
        weightUnit: 'kg',
        value: item.price || 0
      }));
      
      // Calculate total weight (if available in items, otherwise 0)
      const totalWeight = parcels.reduce((sum, parcel) => sum + (parcel.weight || 0), 0);
      
      // Create shipment
      const shipmentData = {
        trackingId,
        orderId: order._id,
        shipperId: order.customerId._id,
        receiverId: order.customerId._id, // Assuming same customer, can be updated if needed
        batchNumber,
        departureDate: new Date(departureDate),
        originBranchId: order.branchId || null,
        destinationBranchId: null, // Can be set later
        parcels,
        totalWeight,
        weightUnit: 'kg',
        shippingCost: order.totalAmount || 0,
        insuranceAmount: 0,
        createdBy: req.user._id,
        history: [{
          status: 'Processing',
          location: order.branchId ? 'Origin Facility' : 'Processing Center',
          notes: `Shipment created from order ${order.orderNumber}`,
          date: new Date(),
          createdBy: req.user._id
        }]
      };
      
      const shipment = new Shipment(shipmentData);
      await shipment.save();
      
      // Populate the shipment
      await shipment.populate('shipperId receiverId originBranchId destinationBranchId orderId createdBy');
      
      createdShipments.push(shipment);
    }
    
    res.status(201).json({
      success: true,
      data: {
        shipments: createdShipments,
        batchNumber,
        count: createdShipments.length
      },
      message: `Successfully created ${createdShipments.length} shipment(s) from orders`
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

