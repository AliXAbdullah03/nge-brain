const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token (never expires)
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
  // No expiresIn option = token never expires
}

/**
 * Generate JWT refresh token (never expires)
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET);
  // No expiresIn option = token never expires
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken
};

