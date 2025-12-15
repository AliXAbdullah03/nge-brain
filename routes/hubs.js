const express = require('express');
const router = express.Router();
const {
  getHubs,
  getAdminHubs,
  getHubById,
  createHub,
  updateHub,
  deleteHub
} = require('../controllers/hubController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Public endpoint - /api/hubs (get active hubs)
router.get('/', getHubs);

// Admin endpoints - require authentication
router.post('/', authenticate, authorize('website_update'), createHub);
router.get('/:id', authenticate, authorize('website_read'), getHubById);
router.put('/:id', authenticate, authorize('website_update'), updateHub);
router.delete('/:id', authenticate, authorize('website_update'), deleteHub);

module.exports = router;
