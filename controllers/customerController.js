const Customer = require('../models/Customer');

/**
 * Get all customers with pagination and search
 */
const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    
    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Customer.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        customers,
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
 * Get customer by ID
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new customer
 */
const createCustomer = async (req, res, next) => {
  try {
    const customerData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      postalCode: req.body.postalCode
    };
    
    const customer = new Customer(customerData);
    await customer.save();
    
    res.status(201).json({
      success: true,
      data: { customer },
      message: 'Customer created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer
 */
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { customer },
      message: 'Customer updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete customer
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

