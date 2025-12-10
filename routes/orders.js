const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  trackOrderOrShipment
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validator');

// GET /api/orders/track/:identifier (PUBLIC - no authentication required)
router.get('/track/:identifier', trackOrderOrShipment);

// GET /api/orders
router.get('/', authenticate, authorize('order:view'), getOrders);

// GET /api/orders/:id
router.get('/:id', authenticate, authorize('order:view'), getOrderById);

// POST /api/orders
router.post('/', authenticate, authorize('order:create'), validateOrder, createOrder);

// PUT /api/orders/:id
router.put('/:id', authenticate, authorize('order:modify'), updateOrder);

// PUT /api/orders/:id/status
router.put('/:id/status', authenticate, authorize('order:modify'), updateOrderStatus);

// DELETE /api/orders/:id
router.delete('/:id', authenticate, authorize('order:delete'), deleteOrder);

module.exports = router;

