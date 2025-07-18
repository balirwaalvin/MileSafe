// PostgreSQL database connection for Supabase
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL pool with error handling
let pool;
try {
  pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test the connection and log result
  pool.connect()
    .then(client => {
      console.log('✅ PostgreSQL/Supabase connected successfully');
      client.release();
    })
    .catch(err => {
      console.warn('⚠️ PostgreSQL connection failed:', err.message);
      console.warn('⚠️ App will continue in mock mode');
    });

} catch (err) {
  console.warn('⚠️ PostgreSQL setup failed:', err.message);
  pool = null;
}

module.exports = pool;
