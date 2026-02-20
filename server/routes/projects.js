const express = require('express');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all projects (protected)
router.get('/', authMiddleware, getAllProjects);

// Get project by ID (protected)
router.get('/:id', authMiddleware, getProjectById);

// Create project (protected)
router.post('/', authMiddleware, createProject);

// Update project (protected)
router.put('/:id', authMiddleware, updateProject);

// Delete project (protected)
router.delete('/:id', authMiddleware, deleteProject);

module.exports = router;
