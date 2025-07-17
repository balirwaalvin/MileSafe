// Import express and initialize the router
const express = require('express');
const router = express.Router();

// Import controller functions for signup and login
const { signup, login } = require('../controllers/authController');

// Route for user signup
// POST /api/auth/signup
router.post('/signup', signup);

// Route for user login
// POST /api/auth/login
router.post('/login', login);

// Export the router to be used in server.js
module.exports = router;
