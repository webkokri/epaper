const express = require('express');
const {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor
} = require('../controllers/authorController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all authors (protected)
router.get('/', authMiddleware, getAllAuthors);

// Get author by ID (protected)
router.get('/:id', authMiddleware, getAuthorById);

// Create author (protected)
router.post('/', authMiddleware, createAuthor);

// Update author (protected)
router.put('/:id', authMiddleware, updateAuthor);

// Delete author (protected)
router.delete('/:id', authMiddleware, deleteAuthor);

module.exports = router;
