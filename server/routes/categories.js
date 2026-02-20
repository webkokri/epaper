const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authMiddleware, publisherMiddleware } = require('../middleware/auth');

// All category routes require admin or publisher role
router.use(authMiddleware, publisherMiddleware);

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Create new category
router.post('/', categoryController.createCategory);

// Update category
router.put('/:id', categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
