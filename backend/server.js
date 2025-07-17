// Import dependencies
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize express app
const app = express();
const port = process.env.PORT || 8080; // Changed default to 8080 for deployment platform
const isDevelopment = process.env.NODE_ENV !== 'production';

// CORS configuration
const corsOptions = {
  origin: isDevelopment 
    ? ['http://localhost:3000', 'http://127.0.0.1:3000'] 
    : [process.env.FRONTEND_URL || '*'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));        // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' }));       // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data

// Serve static files from the root directory (for frontend)
if (isDevelopment) {
  app.use(express.static(path.join(__dirname, '..')));
}

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

// Server listener
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Mile Safe Server running at: http://0.0.0.0:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://0.0.0.0:${port}/health`);
  console.log(`🔍 API endpoint: http://0.0.0.0:${port}/api`);
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
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
