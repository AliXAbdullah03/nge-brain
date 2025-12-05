const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticate, authorize('dashboard_view'), getStats);

module.exports = router;

