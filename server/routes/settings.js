const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const settingsController = require('../controllers/settingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, svg, gif, webp)'));
    }
  }
});

// Public routes
router.get('/public', settingsController.getPublicSettings);
router.get('/subscription-mode', settingsController.checkSubscriptionMode);

// Protected routes (admin only)
router.use(authMiddleware, adminMiddleware);

// Upload logo
router.post('/upload-logo', logoUpload.single('logo'), settingsController.uploadLogo);

// Send test email
router.post('/test-email', settingsController.sendTestEmail);

// Get all settings
router.get('/', settingsController.getAllSettings);

// Get setting by key
router.get('/:key', settingsController.getSettingByKey);

// Create new setting
router.post('/', settingsController.createSetting);

// Update setting
router.put('/:key', settingsController.updateSetting);

// Update multiple settings
router.put('/', settingsController.updateMultipleSettings);

// Delete setting
router.delete('/:key', settingsController.deleteSetting);

module.exports = router;
