const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { validateCustomer } = require('../middleware/validator');

// GET /api/customers
router.get('/', authenticate, authorize('customers_read'), getCustomers);

// GET /api/customers/:id
router.get('/:id', authenticate, authorize('customers_read'), getCustomerById);

// POST /api/customers
router.post('/', authenticate, authorize('customers_create'), validateCustomer, createCustomer);

// PUT /api/customers/:id
router.put('/:id', authenticate, authorize('customers_update'), validateCustomer, updateCustomer);

// DELETE /api/customers/:id
router.delete('/:id', authenticate, authorize('customers_delete'), deleteCustomer);

module.exports = router;

