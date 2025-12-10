const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Shipment = require('../models/Shipment');
const { generateOrderNumber } = require('../utils/generateIds');
const { parseStatusFilter, normalizeStatus, toDatabaseStatus } = require('../utils/statusNormalizer');
const mongoose = require('mongoose');

/**
 * Get all orders with pagination and filters
 */
const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const statusParam = req.query.status;
    const customerId = req.query.customerId;
    
    const query = {};
    
    // Handle status filtering
    if (statusParam) {
      // Parse comma-separated status values and normalize
      const statusFilters = parseStatusFilter(statusParam);
      if (statusFilters.length > 0) {
        query.status = { $in: statusFilters };
      } else {
        // Invalid status values provided
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Invalid status value(s) provided'
          }
        });
      }
    } else if (req.user?.roleId?.name === 'Driver') {
      // Drivers default to out_for_delivery if no status param provided
      query.status = 'out_for_delivery';
    }
    
    if (customerId) query.customerId = customerId;
    
    // Search filtering
    if (search) {
      const searchConditions = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
      
      // If query already has $or (shouldn't happen, but handle it)
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }
    
    const orders = await Order.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('branchId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
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
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid ID format'
        }
      });
    }
    next(error);
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'firstName lastName email phone address city country')
      .populate('branchId', 'name address city country')
      .populate('createdBy', 'firstName lastName email')
      .populate('shipmentId', 'trackingId batchNumber currentStatus');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Ensure orderNumber and status are present (required fields)
    if (!order.orderNumber) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Order missing required field: orderNumber'
        }
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid order ID format'
        }
      });
    }
    next(error);
  }
};

/**
 * Create new order
 * If customerId is provided, use it. Otherwise, check if customer exists by email/phone,
 * or create a new customer if they don't exist.
 */
const createOrder = async (req, res, next) => {
  try {
    let customerId = req.body.customerId;
    
    // If customerId is not provided, check if customer exists or create new one
    if (!customerId) {
      const { email, phone, firstName, lastName, address, city, country, postalCode } = req.body;
      
      if (!firstName || !lastName || !phone) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either customerId or customer details (firstName, lastName, phone) are required'
          }
        });
      }
      
      // Try to find existing customer by email or phone
      let existingCustomer = null;
      if (email) {
        existingCustomer = await Customer.findOne({ 
          $or: [
            { email: email.toLowerCase().trim() },
            { phone: phone.trim() }
          ]
        });
      } else {
        existingCustomer = await Customer.findOne({ phone: phone.trim() });
      }
      
      if (existingCustomer) {
        // Use existing customer
        customerId = existingCustomer._id;
      } else {
        // Create new customer
        const customerData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email ? email.toLowerCase().trim() : undefined,
          address: address ? address.trim() : undefined,
          city: city ? city.trim() : undefined,
          country: country ? country.trim() : undefined,
          postalCode: postalCode ? postalCode.trim() : undefined,
          status: 'active'
        };
        
        const newCustomer = new Customer(customerData);
        await newCustomer.save();
        customerId = newCustomer._id;
      }
    }
    
    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }
    
    const orderNumber = await generateOrderNumber();
    
    const orderData = {
      orderNumber,
      customerId: customerId,
      branchId: req.body.branchId || null,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      currency: req.body.currency || 'USD',
      departureDate: req.body.departureDate,
      notes: req.body.notes,
      createdBy: req.user._id
    };
    
    const order = new Order(orderData);
    await order.save();
    
    await order.populate('customerId', 'firstName lastName email phone');
    await order.populate('branchId', 'name');
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order
 */
const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('customerId', 'firstName lastName email phone')
      .populate('branchId', 'name');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status with role-based validation and database persistence
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const user = req.user;
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required and must be a string'
        }
      });
    }
    
    // Normalize status value
    const normalizedStatus = normalizeStatus(status);
    const dbStatus = toDatabaseStatus(normalizedStatus);
    
    if (!dbStatus) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Invalid status value: ${status}. Valid values: pending, processing, confirmed, in_transit, out_for_delivery, delivered, completed, cancelled`
        }
      });
    }
    
    // Find order in database
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    // Role-based validation for drivers
    const userRole = user?.roleId?.name || user?.role;
    if (userRole === 'Driver') {
      const driverAllowedStatuses = ['out_for_delivery', 'delivered'];
      if (!driverAllowedStatuses.includes(dbStatus)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Drivers can only update orders to "out_for_delivery" or "delivered"'
          }
        });
      }
    }
    
    // Optional: Status transition validation
    const currentStatusNormalized = normalizeStatus(order.status || 'pending');
    const currentDbStatus = toDatabaseStatus(currentStatusNormalized) || 'pending';
    
    // Define valid status transitions
    const validTransitions = {
      'pending': ['processing', 'confirmed', 'cancelled'],
      'processing': ['confirmed', 'in_transit', 'cancelled'],
      'confirmed': ['in_transit', 'cancelled'],
      'in_transit': ['out_for_delivery', 'delivered'],
      'out_for_delivery': ['delivered'],
      'delivered': ['completed'],
      'completed': [], // Terminal state
      'cancelled': [] // Terminal state
    };
    
    const allowedNextStatuses = validTransitions[currentDbStatus] || [];
    if (allowedNextStatuses.length > 0 && !allowedNextStatuses.includes(dbStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition from "${currentDbStatus}" to "${dbStatus}". Allowed transitions: ${allowedNextStatuses.join(', ') || 'none (terminal state)'}`
        }
      });
    }
    
    // Store old status for logging
    const oldStatus = order.status;
    
    // Update order status in memory
    order.status = dbStatus;
    order.updatedAt = new Date();
    
    // CRITICAL: Save to database
    await order.save();
    
    // Verify database update was successful
    const verifyOrder = await Order.findById(id);
    if (!verifyOrder || verifyOrder.status !== dbStatus) {
      console.error('Database update verification failed', {
        orderId: id,
        expectedStatus: dbStatus,
        actualStatus: verifyOrder?.status
      });
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Order status was not saved to database'
        }
      });
    }
    
    // Log the change for audit trail
    console.log('Order status updated', {
      orderId: id,
      orderNumber: order.orderNumber,
      oldStatus: oldStatus,
      newStatus: dbStatus,
      updatedBy: user._id,
      userRole: userRole,
      updatedAt: new Date()
    });
    
    // Populate related fields for response
    await verifyOrder.populate('customerId', 'firstName lastName email phone');
    await verifyOrder.populate('branchId', 'name');
    await verifyOrder.populate('createdBy', 'firstName lastName');
    
    // Return updated order from database
    res.json({
      success: true,
      data: verifyOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid order ID format'
        }
      });
    }
    
    console.error('Error updating order status in database:', error);
    next(error);
  }
};

/**
 * Delete order
 */
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        message: 'Order deleted successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track order or shipment by various identifiers (PUBLIC endpoint)
 */
const trackOrderOrShipment = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    if (!identifier || identifier.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDENTIFIER',
          message: 'Tracking identifier is required'
        }
      });
    }
    
    const trimmedIdentifier = identifier.trim();
    let order = null;
    let shipment = null;
    
    // Check if identifier is a valid MongoDB ObjectId
    const isObjectId = mongoose.Types.ObjectId.isValid(trimmedIdentifier) && 
                       trimmedIdentifier.length === 24;
    
    // Search orders first
    if (isObjectId) {
      // Try as order ID
      try {
        order = await Order.findById(trimmedIdentifier)
          .populate('customerId', 'firstName lastName email phone address city country')
          .populate('branchId', 'name address city country')
          .lean();
      } catch (err) {
        // Invalid ObjectId format, continue with other searches
      }
    }
    
    // If not found by ID, try as orderNumber
    if (!order) {
      order = await Order.findOne({ orderNumber: trimmedIdentifier.toUpperCase() })
        .populate('customerId', 'firstName lastName email phone address city country')
        .populate('branchId', 'name address city country')
        .lean();
    }
    
    // If order found, check if it belongs to a shipment
    if (order) {
      shipment = await Shipment.findOne({
        $or: [
          { orderIds: order._id },
          { orderId: order._id }
        ]
      })
        .populate('shipperId', 'firstName lastName email phone address city country')
        .populate('receiverId', 'firstName lastName email phone address city country')
        .populate({
          path: 'orderIds',
          select: 'orderNumber status customerId departureDate',
          populate: {
            path: 'customerId',
            select: 'firstName lastName email phone'
          }
        })
        .populate('originBranchId', 'name address city country')
        .populate('destinationBranchId', 'name address city country')
        .lean();
    }
    
    // Search shipments if not already found
    if (!shipment) {
      if (isObjectId) {
        try {
          shipment = await Shipment.findById(trimmedIdentifier)
            .populate('shipperId', 'firstName lastName email phone address city country')
            .populate('receiverId', 'firstName lastName email phone address city country')
            .populate({
              path: 'orderIds',
              select: 'orderNumber status customerId departureDate',
              populate: {
                path: 'customerId',
                select: 'firstName lastName email phone'
              }
            })
            .populate('originBranchId', 'name address city country')
            .populate('destinationBranchId', 'name address city country')
            .lean();
        } catch (err) {
          // Invalid ObjectId format, continue with other searches
        }
      }
      
      // Try by trackingId or batchNumber
      if (!shipment) {
        shipment = await Shipment.findOne({
          $or: [
            { trackingId: trimmedIdentifier.toUpperCase() },
            { batchNumber: trimmedIdentifier }
          ]
        })
          .populate('shipperId', 'firstName lastName email phone address city country')
          .populate('receiverId', 'firstName lastName email phone address city country')
          .populate({
            path: 'orderIds',
            select: 'orderNumber status customerId departureDate',
            populate: {
              path: 'customerId',
              select: 'firstName lastName email phone'
            }
          })
          .populate('originBranchId', 'name address city country')
          .populate('destinationBranchId', 'name address city country')
          .lean();
      }
    }
    
    // If nothing found
    if (!order && !shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order or shipment not found with the provided identifier'
        }
      });
    }
    
    // Build response data
    const responseData = {};
    if (order) {
      responseData.order = order;
    }
    if (shipment) {
      responseData.shipment = shipment;
    }
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error tracking order/shipment:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDENTIFIER',
          message: 'Invalid tracking identifier format'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  trackOrderOrShipment
};

