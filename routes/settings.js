const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSettingByKey,
  updateSettings,
  updateSetting
} = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('website_read'), getSettings);
router.get('/:key', authenticate, authorize('website_read'), getSettingByKey);
router.put('/', authenticate, authorize('website_update'), updateSettings);
router.put('/:key', authenticate, authorize('website_update'), updateSetting);

module.exports = router;

