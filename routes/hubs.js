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

// Public endpoint - /api/hubs
router.get('/', getHubs);

module.exports = router;
