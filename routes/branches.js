const express = require('express');
const router = express.Router();
const {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branchController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// GET /api/branches - Public endpoint
router.get('/', getBranches);

// GET /api/branches/:id - Public endpoint
router.get('/:id', getBranchById);
router.post('/', authenticate, authorize('branches_create'), createBranch);
router.put('/:id', authenticate, authorize('branches_update'), updateBranch);
router.delete('/:id', authenticate, authorize('branches_delete'), deleteBranch);

module.exports = router;

