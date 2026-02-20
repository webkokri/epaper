const express = require('express');
const { getStats, updateStats } = require('../controllers/dashboardController');
const { authMiddleware, publisherMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats (admin and publisher only)
router.get('/stats', authMiddleware, publisherMiddleware, getStats);

// Update dashboard stats (admin and publisher only)
router.post('/stats', authMiddleware, publisherMiddleware, updateStats);

module.exports = router;
