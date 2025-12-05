const Role = require('../models/Role');
const Permission = require('../models/Permission');

const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().populate('permissions').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { role }
    });
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { permissionIds, ...roleData } = req.body;
    
    const role = new Role(roleData);
    if (permissionIds && Array.isArray(permissionIds)) {
      role.permissions = permissionIds;
    }
    
    await role.save();
    await role.populate('permissions');
    
    res.status(201).json({
      success: true,
      data: { role },
      message: 'Role created successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { permissionIds, ...roleData } = req.body;
    
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    Object.assign(role, roleData);
    if (permissionIds && Array.isArray(permissionIds)) {
      role.permissions = permissionIds;
    }
    
    await role.save();
    await role.populate('permissions');
    
    res.json({
      success: true,
      data: { role },
      message: 'Role updated successfully'
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
          code: 'NOT_FOUND',
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

