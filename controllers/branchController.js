const Branch = require('../models/Branch');

const getBranches = async (req, res, next) => {
  try {
    const status = req.query.status;
    const query = status ? { status } : {};
    
    const branches = await Branch.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { branches }
    });
  } catch (error) {
    next(error);
  }
};

const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Branch not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { branch }
    });
  } catch (error) {
    next(error);
  }
};

const createBranch = async (req, res, next) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    
    res.status(201).json({
      success: true,
      data: { branch },
      message: 'Branch created successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Branch not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { branch },
      message: 'Branch updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Branch not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
};

