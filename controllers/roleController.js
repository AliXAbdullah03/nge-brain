const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { getStandardizedRoleName } = require('../utils/roleMapper');
const { validatePermissions, VALID_PERMISSIONS } = require('../utils/permissionValidator');

/**
 * Get all roles with their permissions
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    
    // Standardize role names, filter allowed permissions, and de-duplicate by name
    const seen = new Set();
    const standardizedRoles = roles.reduce((acc, role) => {
      const roleObj = role.toObject();
      roleObj.permissions = (roleObj.permissions || []).filter(p => VALID_PERMISSIONS.has(p));
      roleObj.name = getStandardizedRoleName(roleObj.name);
      const key = roleObj.name.toLowerCase().trim();
      if (seen.has(key)) return acc;
      seen.add(key);
      acc.push(roleObj);
      return acc;
    }, []);
    
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
    roleObj.permissions = (roleObj.permissions || []).filter(p => VALID_PERMISSIONS.has(p));
    
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
    
    // Filter permissions to only allowed ones
    const filteredPermissions = permissions.filter(p => VALID_PERMISSIONS.has(p));
    
    // Normalize existing role name to pass enum validation, but avoid duplicates
    // If normalizing would cause a duplicate, skip name update (permissions still update)
    const standardizedName = getStandardizedRoleName(role.name);
    if (!standardizedName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role name'
        }
      });
    }
    
    // Prepare update object - only update permissions, conditionally update name
    const updateData = { permissions: filteredPermissions };
    
    // Only update name if it's different AND won't cause a duplicate
    if (standardizedName !== role.name) {
      const conflict = await Role.findOne({ name: standardizedName, _id: { $ne: role._id } });
      if (!conflict) {
        // Safe to update name - no conflict
        updateData.name = standardizedName;
      }
      // If conflict exists, skip name update but continue with permissions update
    }

    // Use findByIdAndUpdate to only update specified fields, avoiding full document validation
    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );
    
    if (!updatedRole) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    const roleObj = updatedRole.toObject();
    roleObj.permissions = (roleObj.permissions || []).filter(p => VALID_PERMISSIONS.has(p));
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

