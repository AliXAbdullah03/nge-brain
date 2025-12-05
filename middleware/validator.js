const { body, validationResult } = require('express-validator');

/**
 * Validation result handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

/**
 * Login validation
 */
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Customer validation
 */
const validateCustomer = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').optional().isEmail().normalizeEmail(),
  handleValidationErrors
];

/**
 * Order validation
 */
const validateOrder = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('branchId').notEmpty().withMessage('Branch ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').notEmpty().withMessage('Item description is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  handleValidationErrors
];

/**
 * Shipment validation
 */
const validateShipment = [
  body('shipperId').notEmpty().withMessage('Shipper ID is required'),
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('parcels').isArray({ min: 1 }).withMessage('At least one parcel is required'),
  body('parcels.*.itemsDescription').notEmpty().withMessage('Items description is required'),
  body('parcels.*.weight').isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  handleValidationErrors
];

/**
 * Shipment status update validation
 */
const validateShipmentStatus = [
  body('status').notEmpty().withMessage('Status is required'),
  body('location').notEmpty().withMessage('Location is required'),
  handleValidationErrors
];

/**
 * Bulk shipment status update validation
 */
const validateBulkShipmentStatus = [
  body('shipmentIds').isArray({ min: 1 }).withMessage('shipmentIds must be a non-empty array'),
  body('status').notEmpty().withMessage('Status is required'),
  body('location').notEmpty().withMessage('Location is required'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateCustomer,
  validateOrder,
  validateShipment,
  validateShipmentStatus,
  validateBulkShipmentStatus
};

