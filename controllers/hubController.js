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
      data: hub
    });
  } catch (error) {
    next(error);
  }
};

const createHub = async (req, res, next) => {
  try {
    const hubData = {
      name: req.body.name,
      code: req.body.code ? req.body.code.toLowerCase().trim() : undefined,
      address: req.body.address,
      email: req.body.email,
      mobile: req.body.mobile,
      operatingDays: req.body.operatingDays,
      operatingTime: req.body.operatingTime,
      timeZone: req.body.timeZone,
      timeZoneOffset: req.body.timeZoneOffset,
      mapEmbedUrl: req.body.mapEmbedUrl,
      description: req.body.description,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      displayOrder: req.body.displayOrder || 0
    };
    
    // Validate required fields
    if (!hubData.name || !hubData.code || !hubData.address || !hubData.email || !hubData.mobile) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, code, address, email, and mobile are required'
        }
      });
    }
    
    const hub = new HubInformation(hubData);
    await hub.save();
    
    res.status(201).json({
      success: true,
      data: hub,
      message: 'Hub created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Hub with this code already exists'
        }
      });
    }
    next(error);
  }
};

const updateHub = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // Normalize code if provided
    if (updateData.code) {
      updateData.code = updateData.code.toLowerCase().trim();
    }
    
    const hub = await HubInformation.findByIdAndUpdate(
      req.params.id,
      updateData,
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
      data: hub,
      message: 'Hub updated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'Hub with this code already exists'
        }
      });
    }
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

