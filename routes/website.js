const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const {
  getImages,
  getImageById,
  uploadImage,
  updateImage,
  deleteImage
} = require('../controllers/websiteImageController');
const {
  getReviews,
  getReviewById,
  uploadReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Image routes
router.get('/images', authenticate, authorize('website_read'), getImages);
router.get('/images/:id', authenticate, authorize('website_read'), getImageById);
router.post('/images/upload', authenticate, authorize('website_update'), upload.single('file'), uploadImage);
router.put('/images/:id', authenticate, authorize('website_update'), updateImage);
router.delete('/images/:id', authenticate, authorize('website_update'), deleteImage);

// Review routes
router.get('/reviews', authenticate, authorize('website_read'), getReviews);
router.get('/reviews/:id', authenticate, authorize('website_read'), getReviewById);
router.post('/reviews/upload', authenticate, authorize('website_update'), upload.single('file'), uploadReview);
router.put('/reviews/:id', authenticate, authorize('website_update'), upload.single('file'), updateReview);
router.delete('/reviews/:id', authenticate, authorize('website_update'), deleteReview);

module.exports = router;

