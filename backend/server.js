// Import dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

// Try to import auth routes, create fallback if not found
let authRoutes;
try {
  authRoutes = require('./routes/auth');
} catch (err) {
  console.warn('⚠️ Auth routes not found, creating basic fallback');
  authRoutes = express.Router();
  authRoutes.post('/login', (req, res) => {
    res.json({ success: false, message: 'Auth system not configured' });
  });
  authRoutes.post('/register', (req, res) => {
    res.json({ success: false, message: 'Auth system not configured' });
  });
}

// Initialize express app
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const isDevelopment = process.env.NODE_ENV !== 'production';

console.log(`🚀 Starting Mile Safe server on port ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Available env vars: PORT=${process.env.PORT}, NODE_ENV=${process.env.NODE_ENV}`);

// CORS configuration
const corsOptions = {
  origin: isDevelopment 
    ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'] 
    : true, // Allow all origins in production for now
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));        // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' }));       // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data

// Serve static files from the root directory (for frontend)
const frontendPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'frontend') 
  : path.join(__dirname, '..');

app.use(express.static(frontendPath));

console.log(`📁 Serving static files from: ${frontendPath}`);

// Root route handler
app.get('/', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  console.log(`📄 Serving index.html from: ${indexPath}`);
  
  // Check if file exists
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`❌ index.html not found at: ${indexPath}`);
    res.status(404).send(`
      <h1>Mile Safe - Setup Required</h1>
      <p>Frontend files not found. Expected at: ${indexPath}</p>
      <p>Please check your deployment configuration.</p>
      <a href="/health">Health Check</a>
    `);
  }
});

// Security middleware for production
if (!isDevelopment) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const response = {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database connection
  try {
    if (process.env.ENABLE_DATABASE === 'true') {
      const dbPostgres = require('./db-postgres');
      if (dbPostgres) {
        const client = await dbPostgres.connect();
        await client.query('SELECT 1');
        client.release();
        response.database = 'PostgreSQL/Supabase connected successfully';
      } else {
        response.database = 'Database connection not available';
      }
    } else {
      response.database = 'Database disabled (mock mode)';
    }
  } catch (err) {
    response.database = `Database connection failed: ${err.message}`;
  }

  res.status(200).json(response);
});

// Routes
app.use('/api/auth', authRoutes); // Mount authentication routes at /api/auth

// SOS Alerts storage (in-memory for demo; use DB for production)
const sosAlerts = [];
let alertId = 1;

// Receive SOS alert
app.post('/api/sos-alert', (req, res) => {
  const { latitude, longitude, timestamp } = req.body;
  const alert = {
    id: String(alertId++),
    latitude,
    longitude,
    timestamp,
    resolved: false
  };
  sosAlerts.push(alert);
  res.json({ success: true });
});

// Get all SOS alerts
app.get('/api/sos-alerts', (req, res) => {
  res.json(sosAlerts);
});

// Mark alert as resolved
app.post('/api/sos-alerts/:id/resolve', (req, res) => {
  const alert = sosAlerts.find(a => a.id === req.params.id);
  if (alert) alert.resolved = true;
  res.json({ success: !!alert });
});

// Get global accident-prone zones (NYC demo)
app.get('/api/accidents', async (req, res) => {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/h9gi-nx95.json?$limit=500');
    const data = await response.json();
    // Only send lat/lng for heatmap
    const accidentPoints = data
      .filter(d => d.latitude && d.longitude)
      .map(d => ({ lat: parseFloat(d.latitude), lng: parseFloat(d.longitude), intensity: 0.7 }));
    res.json(accidentPoints);
  } catch (err) {
    console.error('Error fetching accident data:', err);
    res.status(500).json({ error: 'Failed to fetch accident data' });
  }
});

// Serve index.html for all non-API routes (SPA support) - MUST BE LAST
app.get('*', (req, res) => {
  try {
    // Skip API routes and health checks
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      return res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path,
        method: req.method
      });
    }
    
    // Serve index.html for all other routes
    const indexPath = path.join(frontendPath, 'index.html');
    const fs = require('fs');
    
    if (fs.existsSync(indexPath)) {
      console.log(`📄 Serving SPA route: ${req.path} -> index.html`);
      res.sendFile(indexPath);
    } else {
      console.error(`❌ index.html not found at: ${indexPath}`);
      res.status(404).send(`
        <h1>Mile Safe - Frontend Not Found</h1>
        <p>The frontend files could not be located.</p>
        <p>Expected at: ${indexPath}</p>
        <p>Current path: ${req.path}</p>
        <a href="/health">Health Check</a>
      `);
    }
  } catch (error) {
    console.error('Error in catch-all route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: isDevelopment ? error.message : 'Something went wrong'
    });
  }
});

// Global error handler (MUST be after all routes)
app.use((err, req, res, next) => {
  console.error('Express error handler:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal Server Error',
    stack: isDevelopment ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Server listener - Bind to 0.0.0.0 for containerized deployment
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Mile Safe Server running at: http://0.0.0.0:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://0.0.0.0:${port}/health`);
  console.log(`🔍 API endpoint: http://0.0.0.0:${port}/api`);
  console.log(`📁 Frontend path: ${frontendPath}`);
  
  // Log environment variables for debugging
  console.log(`🔧 PORT from env: ${process.env.PORT}`);
  console.log(`🔧 NODE_ENV from env: ${process.env.NODE_ENV}`);
});

// Handle server startup errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
