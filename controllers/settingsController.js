const SiteSetting = require('../models/SiteSetting');

const getSettings = async (req, res, next) => {
  try {
    const { category } = req.query;
    
    const query = category ? { category } : {};
    const settings = await SiteSetting.find(query).sort({ category: 1, key: 1 });
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

const getSettingByKey = async (req, res, next) => {
  try {
    const setting = await SiteSetting.findOne({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Setting not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { setting }
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Settings must be an array'
        }
      });
    }
    
    const updatePromises = settings.map(setting => {
      return SiteSetting.findOneAndUpdate(
        { key: setting.key },
        { value: setting.value },
        { upsert: true, new: true, runValidators: true }
      );
    });
    
    const updatedSettings = await Promise.all(updatePromises);
    
    res.json({
      success: true,
      data: { settings: updatedSettings },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { value } = req.body;
    
    const setting = await SiteSetting.findOneAndUpdate(
      { key: req.params.key },
      { value },
      { upsert: true, new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: { setting },
      message: 'Setting updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  getSettingByKey,
  updateSettings,
  updateSetting
};

