const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Try to import database pool, fallback if not available
let pool;
let isPostgreSQL = false;
try {
  // Try PostgreSQL first (for Supabase)
  if (process.env.DB_PORT === '5432') {
    pool = require('../db-postgres');
    isPostgreSQL = true;
    console.log('Using PostgreSQL/Supabase database');
  } else {
    // Fallback to MySQL
    pool = require('../db');
    console.log('Using MySQL database');
  }
} catch (err) {
  console.warn('⚠️ Database connection not available, using mock auth');
  pool = null;
}

const signup = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email and password.' });
  }

  try {
    // If database is not available, provide mock response
    if (!pool) {
      console.log('🔄 Mock signup for:', { username, email, role });
      return res.status(201).json({ 
        message: 'User registered successfully (mock mode).',
        note: 'Database not configured - this is a demo response'
      });
    }

    let existingUser;
    if (isPostgreSQL) {
      // PostgreSQL query (for Supabase)
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      existingUser = result.rows;
    } else {
      // MySQL query
      const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      existingUser = userRows;
    }
    
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role && role === 'admin' ? 'admin' : 'user';

    if (isPostgreSQL) {
      // PostgreSQL query (for Supabase)
      const result = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [username, email, hashedPassword, userRole]
      );
      console.log('User created with ID:', result.rows[0].id);
    } else {
      // MySQL query
      await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, userRole]
      );
    }

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Server error during signup.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('🔍 Login attempt:', { email, passwordLength: password?.length });

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    // If database is not available, provide mock response
    if (!pool) {
      console.log('🔄 Mock login for:', { email });
      // Simple mock validation
      if (email.includes('@') && password.length > 3) {
        const mockToken = jwt.sign(
          { id: 1, email: email, role: 'user' },
          process.env.JWT_SECRET || 'fallback-secret-key',
          { expiresIn: '1h' }
        );
        return res.json({ 
          message: 'Login successful (mock mode).', 
          token: mockToken, 
          role: 'user',
          note: 'Database not configured - this is a demo response'
        });
      } else {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }
    }

    console.log('🔍 Searching for user in database...');
    let users;
    if (isPostgreSQL) {
      // PostgreSQL query (for Supabase)
      console.log('🔍 Using PostgreSQL query for email:', email);
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      users = result.rows;
      console.log('🔍 PostgreSQL result rows:', users.length);
    } else {
      // MySQL query
      const [userRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      users = userRows;
    }
    
    if (users.length === 0) {
      console.log('❌ No user found with email:', email);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });
    
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('🔍 Password validation result:', validPassword);
    
    if (!validPassword) {
      console.log('❌ Invalid password for user:', user.email);
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    console.log('🔍 JWT_SECRET available:', !!process.env.JWT_SECRET);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1h' }
    );

    console.log('✅ Login successful for:', user.email);
    res.json({ message: 'Login successful.', token, role: user.role });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { signup, login };
