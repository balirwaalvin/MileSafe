// Import dependencies
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const path = require('path');
const fetch = require('node-fetch'); // Add at the top if not present
require('dotenv').config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());               // Enable Cross-Origin Resource Sharing
app.use(express.json());       // Parse incoming JSON requests
app.use(express.static(path.join(__dirname, '..'))); // Serve static files from the root directory

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
    res.status(500).json({ error: 'Failed to fetch accident data' });
  }
});

// Server listener
app.listen(port, () => {
  console.log(`✅ Server running at: http://localhost:${port}`);
});
