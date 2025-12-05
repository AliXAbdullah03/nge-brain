const WebsiteImage = require('../models/WebsiteImage');
const { processImage, getImageUrl } = require('../utils/imageProcessor');
const fs = require('fs');
const path = require('path');

const getImages = async (req, res, next) => {
  try {
    const { type, isActive } = req.query;
    
    const query = {};
    if (type) query.imageType = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const images = await WebsiteImage.find(query)
      .sort({ orderIndex: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: { images }
    });
  } catch (error) {
    next(error);
  }
};

const getImageById = async (req, res, next) => {
  try {
    const image = await WebsiteImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { image }
    });
  } catch (error) {
    next(error);
  }
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file uploaded'
        }
      });
    }
    
    // Process image (create thumbnails)
    const processedImages = await processImage(req.file.path);
    
    // Get image URL
    const imageUrl = getImageUrl(processedImages.original);
    
    // Save to database
    const image = new WebsiteImage({
      name: req.body.name || req.file.originalname,
      url: imageUrl,
      storagePath: processedImages.original,
      imageType: req.body.type || 'hero',
      altText: req.body.altText || '',
      orderIndex: parseInt(req.body.orderIndex) || 0,
      isActive: req.body.isActive !== 'false'
    });
    
    await image.save();
    
    res.status(201).json({
      success: true,
      data: { image },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    next(error);
  }
};

const updateImage = async (req, res, next) => {
  try {
    const image = await WebsiteImage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { image },
      message: 'Image updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const image = await WebsiteImage.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found'
        }
      });
    }
    
    // Delete file from filesystem
    if (image.storagePath && fs.existsSync(image.storagePath)) {
      try {
        fs.unlinkSync(image.storagePath);
        // Also delete processed versions if they exist
        const dir = path.dirname(image.storagePath);
        const basename = path.basename(image.storagePath, path.extname(image.storagePath));
        const ext = path.extname(image.storagePath);
        const mediumPath = path.join(dir, `${basename}_medium${ext}`);
        const thumbPath = path.join(dir, `${basename}_thumb${ext}`);
        if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }
    
    await WebsiteImage.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getImages,
  getImageById,
  uploadImage,
  updateImage,
  deleteImage
};

