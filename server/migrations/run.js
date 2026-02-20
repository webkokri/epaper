const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const runMigrations = async () => {
  try {
    console.log('🚀 Running database migrations...');

    const sqlFile = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());

    const connection = await pool.getConnection();

    for (let statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore duplicate entry errors
          if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  Skipping duplicate entry');
          } else {
            console.error('❌ Error executing statement:', error.message);
          }
        }
      }
    }

    connection.release();
    console.log('✅ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigrations();
