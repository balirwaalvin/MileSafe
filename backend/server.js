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
const port = parseInt(process.env.PORT) || 8080; // Ensure port is a number
const isDevelopment = process.env.NODE_ENV !== 'production';

console.log(`🚀 Starting Mile Safe server on port ${port}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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
  // Skip API routes and health checks
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Serve index.html for all other routes
  const indexPath = path.join(frontendPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend files not found');
  }
});

// Server listener
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Mile Safe Server running at: http://0.0.0.0:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://0.0.0.0:${port}/health`);
  console.log(`🔍 API endpoint: http://0.0.0.0:${port}/api`);
  console.log(`📁 Frontend path: ${frontendPath}`);
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: isDevelopment ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
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
