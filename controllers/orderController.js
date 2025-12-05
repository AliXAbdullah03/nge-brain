const Order = require('../models/Order');
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
      .populate('customerId')
      .populate('branchId')
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
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new order
 */
const createOrder = async (req, res, next) => {
  try {
    const orderNumber = await generateOrderNumber();
    
    const orderData = {
      orderNumber,
      customerId: req.body.customerId,
      branchId: req.body.branchId,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      currency: req.body.currency || 'USD',
      notes: req.body.notes,
      createdBy: req.user._id
    };
    
    const order = new Order(orderData);
    await order.save();
    
    await order.populate('customerId branchId createdBy');
    
    res.status(201).json({
      success: true,
      data: { order },
      message: 'Order created successfully'
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
    ).populate('customerId branchId createdBy');
    
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
      data: { order },
      message: 'Order updated successfully'
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
    const { status, notes } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, notes: notes || order.notes },
      { new: true, runValidators: true }
    ).populate('customerId branchId createdBy');
    
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
      data: { order },
      message: 'Order status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order (soft delete by setting status to cancelled)
 */
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    
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
      message: 'Order cancelled successfully'
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

