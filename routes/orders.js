const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validator');

// GET /api/orders
router.get('/', authenticate, authorize('orders_read'), getOrders);

// GET /api/orders/:id
router.get('/:id', authenticate, authorize('orders_read'), getOrderById);

// POST /api/orders
router.post('/', authenticate, authorize('orders_create'), validateOrder, createOrder);

// PUT /api/orders/:id
router.put('/:id', authenticate, authorize('orders_update'), updateOrder);

// PUT /api/orders/:id/status
router.put('/:id/status', authenticate, authorize('orders_update'), updateOrderStatus);

// DELETE /api/orders/:id
router.delete('/:id', authenticate, authorize('orders_delete'), deleteOrder);

module.exports = router;

