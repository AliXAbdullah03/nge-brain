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

router.get('/', authenticate, authorize('users_read'), getUsers);
router.get('/:id', authenticate, authorize('users_read'), getUserById);
router.post('/', authenticate, authorize('users_create'), createUser);
router.put('/:id', authenticate, authorize('users_update'), updateUser);
router.put('/:id/password', authenticate, authorize('users_update'), updateUserPassword);
router.put('/:id/status', authenticate, authorize('users_update'), updateUserStatus);
router.delete('/:id', authenticate, authorize('users_delete'), deleteUser);

module.exports = router;

