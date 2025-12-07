const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { getStandardizedRoleName } = require('../utils/roleMapper');
const { validatePermissions } = require('../utils/permissionValidator');

/**
 * Get all roles with their permissions
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    
    // Standardize role names and ensure permissions are strings
    const standardizedRoles = roles.map(role => {
      const roleObj = role.toObject();
      // Use permissions array (string array) if available, otherwise empty
      roleObj.permissions = roleObj.permissions || [];
      // Standardize role name
      roleObj.name = getStandardizedRoleName(roleObj.name);
      return roleObj;
    });
    
    res.json({
      success: true,
      data: { roles: standardizedRoles }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get role by ID
 */
const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    const roleObj = role.toObject();
    roleObj.permissions = roleObj.permissions || [];
    roleObj.name = getStandardizedRoleName(roleObj.name);
    
    res.json({
      success: true,
      data: roleObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new role
 */
const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions, permissionIds } = req.body;
    
    // Validate and standardize role name
    const standardizedName = getStandardizedRoleName(name);
    if (!standardizedName || !['Driver', 'Super Admin', 'Admin', 'Hub Receiver'].includes(standardizedName)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role name. Must be one of: Driver, Super Admin, Admin, Hub Receiver'
        }
      });
    }
    
    // Validate permissions if provided
    if (permissions) {
      const validation = validatePermissions(permissions);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid permission: '${validation.invalid[0]}'`
          }
        });
      }
    }
    
    const roleData = {
      name: standardizedName,
      description,
      permissions: permissions || []
    };
    
    // Support backward compatibility with permissionIds
    if (permissionIds && Array.isArray(permissionIds)) {
      roleData.permissionIds = permissionIds;
    }
    
    const role = new Role(roleData);
    await role.save();
    
    const roleObj = role.toObject();
    roleObj.permissions = roleObj.permissions || [];
    
    res.status(201).json({
      success: true,
      data: roleObj
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role with this name already exists'
        }
      });
    }
    next(error);
  }
};

/**
 * Update role permissions
 */
const updateRole = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    
    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'permissions array is required'
        }
      });
    }
    
    // Validate permissions
    const validation = validatePermissions(permissions);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid permission: '${validation.invalid[0]}'`
        }
      });
    }
    
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    // Update permissions
    role.permissions = permissions;
    await role.save();
    
    const roleObj = role.toObject();
    roleObj.permissions = roleObj.permissions || [];
    roleObj.name = getStandardizedRoleName(roleObj.name);
    
    res.json({
      success: true,
      data: roleObj,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find().sort({ resource: 1, action: 1 });
    
    res.json({
      success: true,
      data: { permissions }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions
};

