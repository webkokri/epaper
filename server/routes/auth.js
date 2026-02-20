const express = require('express');
const { body } = require('express-validator');
const { 
  register, 
  login, 
  getMe, 
  getAllUsers, 
  createUser, 
  updateUserRole, 
  deleteUser 
} = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  login
);

// Get current user (protected)
router.get('/me', authMiddleware, getMe);

// Admin routes - require both auth and admin middleware
// Get all users
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

// Create user (admin only)
router.post(
  '/users',
  authMiddleware,
  adminMiddleware,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'publisher', 'user']).withMessage('Role must be admin, publisher, or user')
  ],
  createUser
);

// Update user role
router.put('/users/:id/role', authMiddleware, adminMiddleware, updateUserRole);

// Delete user
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
