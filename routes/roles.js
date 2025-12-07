const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole
} = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// GET /api/roles - List all roles with permissions
router.get('/', authenticate, getRoles);

// GET /api/roles/:id - Get specific role
router.get('/:id', authenticate, getRoleById);

// POST /api/roles - Create new role
router.post('/', authenticate, authorize('settings:modify'), createRole);

// PUT /api/roles/:id - Update role permissions
router.put('/:id', authenticate, authorize('settings:modify'), updateRole);

module.exports = router;

