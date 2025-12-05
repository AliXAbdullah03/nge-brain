const HubInformation = require('../models/HubInformation');

// Public endpoint - get active hubs
const getHubs = async (req, res, next) => {
  try {
    const hubs = await HubInformation.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: hubs
    });
  } catch (error) {
    next(error);
  }
};

// Admin endpoints
const getAdminHubs = async (req, res, next) => {
  try {
    const hubs = await HubInformation.find()
      .sort({ displayOrder: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: hubs
    });
  } catch (error) {
    next(error);
  }
};

const getHubById = async (req, res, next) => {
  try {
    const hub = await HubInformation.findById(req.params.id);
    
    if (!hub) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hub not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { hub }
    });
  } catch (error) {
    next(error);
  }
};

const createHub = async (req, res, next) => {
  try {
    const hub = new HubInformation(req.body);
    await hub.save();
    
    res.status(201).json({
      success: true,
      data: { hub },
      message: 'Hub created successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateHub = async (req, res, next) => {
  try {
    const hub = await HubInformation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!hub) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hub not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { hub },
      message: 'Hub updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteHub = async (req, res, next) => {
  try {
    const hub = await HubInformation.findByIdAndDelete(req.params.id);
    
    if (!hub) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hub not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Hub deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHubs,
  getAdminHubs,
  getHubById,
  createHub,
  updateHub,
  deleteHub
};

