const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/shipmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const { validateShipment, validateShipmentStatus, validateBulkShipmentStatus } = require('../middleware/validator');

// GET /api/shipments/track/:trackingId (public endpoint)
router.get('/track/:trackingId', trackShipment);

// GET /api/shipments
router.get('/', authenticate, authorize('shipment:view'), getShipments);

// POST /api/shipments
router.post('/', authenticate, authorize('shipment:view'), validateShipment, createShipment);

// POST /api/shipments/create-from-orders (must come before /:id routes)
router.post('/create-from-orders', authenticate, authorize('shipment:view'), createShipmentsFromOrders);

// PUT /api/shipments/bulk/status (must come before /:id routes)
router.put('/bulk/status', authenticate, authorize('shipment:bulk_update'), validateBulkShipmentStatus, updateBulkStatus);

// POST /api/shipments/:id/status
router.post('/:id/status', authenticate, authorize('shipment:status_update'), validateShipmentStatus, updateShipmentStatus);

// GET /api/shipments/:id
router.get('/:id', authenticate, authorize('shipment:view'), getShipmentById);

// PUT /api/shipments/:id
router.put('/:id', authenticate, authorize('shipment:view'), updateShipment);

// DELETE /api/shipments/:id
router.delete('/:id', authenticate, authorize('shipment:view'), deleteShipment);

// GET /api/shipments/batch/:batchNumber
router.get('/batch/:batchNumber', authenticate, authorize('shipment:view'), getShipmentsByBatch);

// PUT /api/shipments/batch/:batchNumber/status
router.put('/batch/:batchNumber/status', authenticate, authorize('shipment:status_update'), validateShipmentStatus, updateBatchStatus);

module.exports = router;

