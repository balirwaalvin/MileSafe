// Database initialization script
const { Pool } = require('pg');

const initDatabase = async () => {
  let pool;
  
  try {
    // Use DATABASE_URL if available (Heroku)
    const config = process.env.DATABASE_URL ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    } : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS,
      database: process.env.DB_NAME || 'postgres',
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    pool = new Pool(config);
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await pool.query(createUsersTable);
    console.log('✅ Users table created successfully');
    
    // Check if table exists and show structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Users table structure:', tableInfo.rows);
    
    return { success: true, message: 'Database initialized successfully', table: tableInfo.rows };
    
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

module.exports = { initDatabase };
