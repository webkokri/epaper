const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Routes that need file uploads (must be before JSON middleware)
app.use('/api/epapers', require('./routes/epapers'));
app.use('/api/advertisements', require('./routes/advertisements'));

// Stripe webhook endpoint (needs raw body)
const subscriptionController = require('./controllers/subscriptionController');
app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// JSON parsing middleware (applied after file upload routes and webhook)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes that use JSON
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/authors', require('./routes/authors'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/areamaps', require('./routes/areamaps'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/settings', require('./routes/settings'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  const pool = require('./config/database');
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as test');
    connection.release();
    res.json({ status: 'OK', message: 'Database connected successfully', result: rows });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      errno: error.errno
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;
