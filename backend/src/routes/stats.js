const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/stats/me
// @desc    Get current user's stats
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      chips: user.chips,
      stats: user.stats,
      gameHistory: user.gameHistory,
      netProfitLoss: user.netProfitLoss,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// @route   GET /api/stats/user/:userId
// @desc    Get specific user's stats
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'username stats gameHistory'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      stats: user.stats,
      gameHistory: user.gameHistory.slice(-10), // Last 10 games only
      netProfitLoss: user.netProfitLoss,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error fetching user stats' });
  }
});

// @route   GET /api/stats/leaderboard
// @desc    Get top players leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { limit = 10, sortBy = 'totalWinnings' } = req.query;

    const validSortFields = ['totalWinnings', 'handsWon', 'chips'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalWinnings';

    const users = await User.find({ isGuest: false })
      .select('username stats chips')
      .sort({ [`stats.${sortField}`]: -1 })
      .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      chips: user.chips,
      handsWon: user.stats.handsWon,
      totalWinnings: user.stats.totalWinnings,
      netProfitLoss: user.netProfitLoss,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// @route   PUT /api/stats/admin/add-chips
// @desc    Admin: Add chips to user account
// @access  Private + Admin
router.put('/admin/add-chips', protect, admin, async (req, res) => {
  try {
    const { username, amount } = req.body;

    if (!username || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid username or amount' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.chips += parseInt(amount);
    await user.save();

    res.json({
      message: 'Chips added successfully',
      user: {
        username: user.username,
        chips: user.chips,
      },
    });
  } catch (error) {
    console.error('Add chips error:', error);
    res.status(500).json({ message: 'Server error adding chips' });
  }
});

// @route   GET /api/stats/admin/users
// @desc    Admin: Get all users
// @access  Private + Admin
router.get('/admin/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ isGuest: false })
      .select('username chips stats isOnline createdAt')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

module.exports = router;
