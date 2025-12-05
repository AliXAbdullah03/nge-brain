const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('roleId');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid email or password'
        }
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid email or password'
        }
      });
    }
    
    // Check user status
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'Account is inactive or suspended'
        }
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Get permissions
    let permissions = [];
    if (user.roleId) {
      const role = await Role.findById(user.roleId).populate('permissions');
      if (role && role.permissions) {
        permissions = role.permissions.map(p => p.name);
      }
    }
    
    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.roleId?.name || 'User',
      permissions: permissions
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.roleId?.name || 'User',
          permissions: permissions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side token removal, but can add token blacklist here)
 */
const logout = async (req, res) => {
  // In a production system, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Refresh access token
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Refresh token is required'
        }
      });
    }
    
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid refresh token'
        }
      });
    }
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).populate('roleId');
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'User not found or inactive'
        }
      });
    }
    
    // Get permissions
    let permissions = [];
    if (user.roleId) {
      const role = await Role.findById(user.roleId).populate('permissions');
      if (role && role.permissions) {
        permissions = role.permissions.map(p => p.name);
      }
    }
    
    // Generate new access token
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.roleId?.name || 'User',
      permissions: permissions
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    
    res.json({
      success: true,
      data: {
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  refresh
};

