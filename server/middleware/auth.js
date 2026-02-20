const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Optional auth middleware - extracts user if token present, but doesn't require it
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Token invalid, but we don't require it - just continue without user
    next();
  }
};

// Admin middleware - checks if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Publisher middleware - checks if user is admin or publisher
const publisherMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'publisher') {
    return res.status(403).json({ message: 'Access denied. Admin or Publisher only.' });
  }
  next();
};

// Helper function to check if user can access dashboard (admin or publisher)
const canAccessDashboard = (role) => {
  return role === 'admin' || role === 'publisher';
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = { 
  authMiddleware, 
  optionalAuthMiddleware,
  adminMiddleware, 
  publisherMiddleware,
  canAccessDashboard,
  generateToken, 
  JWT_SECRET 
};
