const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { generateOrderNumber } = require('../utils/generateIds');

/**
 * Get all orders with pagination and filters
 */
const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    const customerId = req.query.customerId;
    
    const query = {};
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    const orders = await Order.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('branchId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
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
    next(error);
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('branchId', 'name')
      .populate('createdBy');
    
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
 * Update order status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'confirmed', 'in_transit', 'delivered', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
        }
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
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

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};

