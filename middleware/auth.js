const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        }
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid token'
        }
      });
    }
    
    const user = await User.findById(decoded.userId)
      .populate('roleId')
      .select('-passwordHash');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'User not found or inactive'
        }
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_INVALID',
        message: 'Invalid token'
      }
    });
  }
};

/**
 * Authorization middleware - check permissions
 */
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required'
          }
        });
      }
      
      // Super Admin has all permissions
      if (req.user.roleId?.name === 'Super Admin') {
        return next();
      }
      
      // Get user permissions
      const role = await Role.findById(req.user.roleId);
      if (!role) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Role not found'
          }
        });
      }
      
      // Support both string array and ObjectId array (backward compatibility)
      let userPermissions = [];
      if (role.permissions && role.permissions.length > 0) {
        // If permissions is string array, use it directly
        if (typeof role.permissions[0] === 'string') {
          userPermissions = role.permissions;
        } else {
          // If it's ObjectId array, populate and get names
          await role.populate('permissions');
          userPermissions = role.permissions.map(p => p.name);
        }
      } else if (role.permissionIds && role.permissionIds.length > 0) {
        // Fallback to permissionIds for backward compatibility
        await role.populate('permissionIds');
        userPermissions = role.permissionIds.map(p => p.name);
      }
      
      // Check if user has at least one required permission
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Insufficient permissions'
          }
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Error checking permissions'
        }
      });
    }
  };
};

module.exports = {
  authenticate,
  authorize
};

