const express = require('express');
const router = express.Router();
const areaMapController = require('../controllers/areaMapController');
const { authMiddleware: authenticate } = require('../middleware/auth');

// Protected routes
router.get('/e-paper/:e_paper_id', authenticate, areaMapController.getAreaMapsByEPaper);
router.get('/page/:page_id', authenticate, areaMapController.getAreaMapsByPage);
router.post('/test-point/:page_id', authenticate, areaMapController.testPointInArea);

// Protected routes
router.post('/', authenticate, areaMapController.createAreaMap);
router.post('/batch', authenticate, areaMapController.batchCreateAreaMaps);
router.put('/:id', authenticate, areaMapController.updateAreaMap);
router.delete('/:id', authenticate, areaMapController.deleteAreaMap);
router.get('/stats/:e_paper_id', authenticate, areaMapController.getAreaMapStats);

module.exports = router;
