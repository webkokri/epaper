const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const advertisementController = require('../controllers/advertisementController');
const { authMiddleware: authenticate } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/ads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Protected routes
router.get('/', authenticate, advertisementController.getAllAdvertisements);
router.get('/:id', authenticate, advertisementController.getAdvertisementById);
router.get('/:id/stats', authenticate, advertisementController.getAdStats);
router.get('/e-paper/:e_paper_id/active', authenticate, advertisementController.getActiveAdsForEPaper);

// Protected routes
router.post('/', authenticate, upload.single('image'), advertisementController.createAdvertisement);
router.put('/:id', authenticate, upload.single('image'), advertisementController.updateAdvertisement);
router.delete('/:id', authenticate, advertisementController.deleteAdvertisement);
router.post('/:id/impression', advertisementController.recordImpression);
router.post('/:id/click', advertisementController.recordClick);
router.post('/place', authenticate, advertisementController.placeAd);
router.delete('/placement/:placement_id', authenticate, advertisementController.removeAdPlacement);

module.exports = router;
