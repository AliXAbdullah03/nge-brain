const express = require('express');
const router = express.Router();
const {
  getRoles
} = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// GET /api/roles - List all roles with permissions
router.get('/', authenticate, authorize('roles_read'), getRoles);

module.exports = router;

