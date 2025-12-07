const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  updateUserStatus,
  deleteUser
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('user:view'), getUsers);
router.get('/:id', authenticate, authorize('user:view'), getUserById);
router.post('/', authenticate, authorize('user:create'), createUser);
router.put('/:id', authenticate, authorize('user:modify'), updateUser);
router.put('/:id/password', authenticate, authorize('user:modify'), updateUserPassword);
router.put('/:id/status', authenticate, authorize('user:modify'), updateUserStatus);
router.delete('/:id', authenticate, authorize('user:delete'), deleteUser);

module.exports = router;

