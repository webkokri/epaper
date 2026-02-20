const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const epaperController = require('../controllers/epaperController');
const { authMiddleware: authenticate, optionalAuthMiddleware, publisherMiddleware } = require('../middleware/auth');

// Configure multer for PDF and image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, path.join(__dirname, '../uploads/papers'));
    } else {
      cb(null, path.join(__dirname, '../uploads/pages'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF or image files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Public routes
router.get('/share/:token', epaperController.getSharedCrop);
router.get('/', epaperController.getAllEPapers);
router.get('/:id', optionalAuthMiddleware, epaperController.getEPaperById);

// Protected routes (admin and publisher only)
router.post('/', authenticate, publisherMiddleware, upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'images', maxCount: 100 }]), epaperController.createEPaper);
router.put('/:id', authenticate, publisherMiddleware, epaperController.updateEPaper);
router.delete('/:id', authenticate, publisherMiddleware, epaperController.deleteEPaper);
router.post('/:id/publish', authenticate, publisherMiddleware, epaperController.publishEPaper);
router.post('/crop-share', authenticate, publisherMiddleware, epaperController.cropAndShare);

module.exports = router;
