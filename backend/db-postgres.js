// PostgreSQL database connection for Heroku and Supabase
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL pool with error handling
let pool;
try {
  // Use DATABASE_URL if available (Heroku), otherwise use individual env vars (Supabase)
  const config = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  } : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  console.log('🔗 PostgreSQL config:', {
    usingDatabaseUrl: !!process.env.DATABASE_URL,
    host: config.host || 'from DATABASE_URL',
    database: config.database || 'from DATABASE_URL',
    port: config.port || 'from DATABASE_URL',
    ssl: !!config.ssl
  });

  pool = new Pool(config);

  // Test the connection and log result
  pool.connect()
    .then(client => {
      console.log('✅ PostgreSQL connected successfully');
      client.release();
    })
    .catch(err => {
      console.error('❌ PostgreSQL connection failed:', err.message);
      console.error('❌ Config used:', JSON.stringify(config, null, 2));
    });

} catch (err) {
  console.error('❌ PostgreSQL setup failed:', err.message);
  pool = null;
}

module.exports = pool;
