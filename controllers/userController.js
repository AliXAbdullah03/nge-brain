const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const { getStandardizedRoleName, isValidRoleName } = require('../utils/roleMapper');

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const roleId = req.query.roleId;
    const branchId = req.query.branchId;
    const status = req.query.status;
    
    const query = {};
    if (roleId) query.roleId = roleId;
    if (branchId) query.branchId = branchId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .populate('roleId', 'name')
      .populate('branchId', 'name')
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Standardize role names in response
    users.forEach(user => {
      if (user.roleId) {
        user.roleId.name = getStandardizedRoleName(user.roleId.name);
      }
    });
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('roleId', 'name')
      .populate('branchId', 'name')
      .select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Standardize role name in response
    if (user.roleId) {
      user.roleId.name = getStandardizedRoleName(user.roleId.name);
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { password, roleId, branchId, ...userData } = req.body;
    
    // Validate roleId exists
    if (!roleId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'roleId is required'
        }
      });
    }
    
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid roleId. Role not found'
        }
      });
    }
    
    // Validate and standardize role name
    const standardizedRoleName = getStandardizedRoleName(role.name);
    if (!isValidRoleName(standardizedRoleName)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role. Must be one of: Driver, Super Admin, Admin, Hub Receiver'
        }
      });
    }
    
    // Update role name if it was mapped
    if (role.name !== standardizedRoleName) {
      role.name = standardizedRoleName;
      await role.save();
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
      passwordHash,
      roleId,
      branchId: branchId || null
    });
    
    await user.save();
    
    const userResponse = await User.findById(user._id)
      .populate('roleId', 'name')
      .populate('branchId', 'name')
      .select('-passwordHash');
    
    // Standardize role name in response
    if (userResponse.roleId) {
      userResponse.roleId.name = getStandardizedRoleName(userResponse.roleId.name);
    }
    
    res.status(201).json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A user with this email already exists'
        }
      });
    }
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { password, roleId, branchId, ...updateData } = req.body;
    
    // Handle password update if provided
    if (password) {
      const saltRounds = 10;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }
    
    // Validate roleId if provided
    if (roleId !== undefined) {
      if (roleId === null || roleId === '') {
        updateData.roleId = null;
      } else {
        const role = await Role.findById(roleId);
        if (!role) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid roleId. Role not found'
            }
          });
        }
        
        // Validate and standardize role name
        const standardizedRoleName = getStandardizedRoleName(role.name);
        if (!isValidRoleName(standardizedRoleName)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid role. Must be one of: Driver, Super Admin, Admin, Hub Receiver'
            }
          });
        }
        
        // Update role name if it was mapped
        if (role.name !== standardizedRoleName) {
          role.name = standardizedRoleName;
          await role.save();
        }
        
        updateData.roleId = roleId;
      }
    }
    
    // Handle branchId
    if (branchId !== undefined) {
      updateData.branchId = branchId || null;
    }
    
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('roleId', 'name')
      .populate('branchId', 'name')
      .select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Standardize role name in response
    if (user.roleId) {
      user.roleId.name = getStandardizedRoleName(user.roleId.name);
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A user with this email already exists'
        }
      });
    }
    next(error);
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'Current password is incorrect'
        }
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('roleId')
      .populate('branchId')
      .select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { user },
      message: 'User status updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  updateUserStatus,
  deleteUser
};

