const Review = require('../models/Review');
const { processImage, getImageUrl } = require('../utils/imageProcessor');
const fs = require('fs');
const path = require('path');

const getReviews = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const reviews = await Review.find(query)
      .sort({ displayOrder: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

const uploadReview = async (req, res, next) => {
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
    const review = new Review({
      customerName: req.body.customerName || 'Anonymous',
      rating: parseInt(req.body.rating) || 5,
      comment: req.body.comment || '',
      imageUrl: imageUrl,
      storagePath: processedImages.original,
      isActive: req.body.isActive !== 'false',
      displayOrder: parseInt(req.body.displayOrder) || 0
    });
    
    await review.save();
    
    res.status(201).json({
      success: true,
      data: { review },
      message: 'Review uploaded successfully'
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

const updateReview = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // If new image is uploaded, process it
    if (req.file) {
      const processedImages = await processImage(req.file.path);
      const imageUrl = getImageUrl(processedImages.original);
      
      // Delete old image
      const review = await Review.findById(req.params.id);
      if (review && review.storagePath && fs.existsSync(review.storagePath)) {
        try {
          fs.unlinkSync(review.storagePath);
          const dir = path.dirname(review.storagePath);
          const basename = path.basename(review.storagePath, path.extname(review.storagePath));
          const ext = path.extname(review.storagePath);
          const mediumPath = path.join(dir, `${basename}_medium${ext}`);
          const thumbPath = path.join(dir, `${basename}_thumb${ext}`);
          if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        } catch (fileError) {
          console.error('Error deleting old file:', fileError);
        }
      }
      
      updateData.imageUrl = imageUrl;
      updateData.storagePath = processedImages.original;
    }
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { review },
      message: 'Review updated successfully'
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

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found'
        }
      });
    }
    
    // Delete file from filesystem
    if (review.storagePath && fs.existsSync(review.storagePath)) {
      try {
        fs.unlinkSync(review.storagePath);
        // Also delete processed versions if they exist
        const dir = path.dirname(review.storagePath);
        const basename = path.basename(review.storagePath, path.extname(review.storagePath));
        const ext = path.extname(review.storagePath);
        const mediumPath = path.join(dir, `${basename}_medium${ext}`);
        const thumbPath = path.join(dir, `${basename}_thumb${ext}`);
        if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }
    
    await Review.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  getReviewById,
  uploadReview,
  updateReview,
  deleteReview
};

