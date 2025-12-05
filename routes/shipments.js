const express = require('express');
const router = express.Router();
const {
  getShipments,
  getShipmentById,
  trackShipment,
  createShipment,
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
router.get('/', authenticate, authorize('shipments_read'), getShipments);

// POST /api/shipments
router.post('/', authenticate, authorize('shipments_create'), validateShipment, createShipment);

// PUT /api/shipments/bulk/status (must come before /:id routes)
router.put('/bulk/status', authenticate, authorize('shipments_update'), validateBulkShipmentStatus, updateBulkStatus);

// POST /api/shipments/:id/status
router.post('/:id/status', authenticate, authorize('shipments_update'), validateShipmentStatus, updateShipmentStatus);

// GET /api/shipments/:id
router.get('/:id', authenticate, authorize('shipments_read'), getShipmentById);

// PUT /api/shipments/:id
router.put('/:id', authenticate, authorize('shipments_update'), updateShipment);

// DELETE /api/shipments/:id
router.delete('/:id', authenticate, authorize('shipments_delete'), deleteShipment);

// GET /api/shipments/batch/:batchNumber
router.get('/batch/:batchNumber', authenticate, authorize('shipments_read'), getShipmentsByBatch);

// PUT /api/shipments/batch/:batchNumber/status
router.put('/batch/:batchNumber/status', authenticate, authorize('shipments_update'), validateShipmentStatus, updateBatchStatus);

module.exports = router;

