const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, logout, refresh } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later'
    }
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, validateLogin, login);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

// POST /api/auth/refresh
router.post('/refresh', refresh);

module.exports = router;

