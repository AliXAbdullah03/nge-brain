const express = require('express');
const router = express.Router();
const {
  getAdminHubs,
  getHubById,
  createHub,
  updateHub,
  deleteHub
} = require('../controllers/hubController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Admin endpoints - /api/admin/hubs
router.get('/', authenticate, authorize('website_read'), getAdminHubs);
router.get('/:id', authenticate, authorize('website_read'), getHubById);
router.post('/', authenticate, authorize('website_update'), createHub);
router.put('/:id', authenticate, authorize('website_update'), updateHub);
router.delete('/:id', authenticate, authorize('website_update'), deleteHub);

module.exports = router;

