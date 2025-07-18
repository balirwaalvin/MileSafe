// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create database pool with error handling
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'milesafe',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Test the connection and log result
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.warn('⚠️ Database connection failed:', err.message);
    console.warn('⚠️ App will continue in mock mode');
  });

module.exports = pool;
