const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');

/**
 * Get dashboard statistics
 */
const getStats = async (req, res, next) => {
  try {
    // Get total customers
    const totalCustomers = await Customer.countDocuments({ status: 'active' });
    
    // Get active orders
    const activeOrders = await Order.countDocuments({
      status: { $in: ['pending', 'processing'] }
    });
    
    // Get in-transit shipments
    const inTransit = await Shipment.countDocuments({
      currentStatus: { $in: ['In Transit', 'Out for Delivery'] }
    });
    
    // Get total revenue (from completed orders)
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    
    // Get recent orders
    const recentOrders = await Order.find()
      .populate('customerId', 'firstName lastName email phone')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-items');
    
    // Get recent shipments
    const recentShipments = await Shipment.find()
      .populate('shipperId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('trackingId currentStatus createdAt');
    
    res.json({
      success: true,
      data: {
        totalCustomers,
        activeOrders,
        inTransit,
        totalRevenue,
        recentOrders,
        recentShipments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats
};

