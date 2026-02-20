const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: 'srv902.hstgr.io',
  user: 'u206708889_epaper',
  password: 'Kokri@786786',
  database: 'u206708889_epaper',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  },
  Promise: global.Promise
});

// Test connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
  }
};

// Attach testConnection to pool for convenience
pool.testConnection = testConnection;

// Run test on startup
testConnection();

module.exports = pool;

