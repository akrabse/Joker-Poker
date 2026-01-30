const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      chips: 500, // Default starting chips
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        chips: user.chips,
        stats: user.stats,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update online status
    user.isOnline = true;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      chips: user.chips,
      stats: user.stats,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/guest
// @desc    Create guest account
// @access  Public
router.post('/guest', async (req, res) => {
  try {
    // Generate unique guest username
    const guestNumber = Math.floor(Math.random() * 10000);
    const username = `guest${guestNumber}`;

    // Check if username exists (unlikely but possible)
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(409).json({ message: 'Please try again' });
    }

    // Create guest user
    const user = await User.create({
      username,
      isGuest: true,
      chips: 500,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      chips: user.chips,
      isGuest: true,
      stats: user.stats,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    res.status(500).json({ message: 'Server error creating guest account' });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check admin credentials
    if (username !== process.env.ADMIN_USERNAME || password !== 'Angill963') {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate admin token
    const adminToken = generateToken('admin-' + Date.now());

    res.json({
      username: process.env.ADMIN_USERNAME,
      isAdmin: true,
      token: adminToken,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

module.exports = router;
