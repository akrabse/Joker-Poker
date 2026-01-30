const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');
const GameController = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/games/create
// @desc    Create a new game room
// @access  Private
router.post('/create', async (req, res) => {
  try {
    const result = await GameController.createRoom(req.user._id, req.user.username);

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.status(201).json({
      message: 'Room created successfully',
      roomId: result.game.roomId,
      game: result.game,
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// @route   POST /api/games/join/:roomId
// @desc    Join an existing game room
// @access  Private
router.post('/join/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await GameController.joinRoom(roomId, req.user._id, req.user.username);

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Joined room successfully',
      game: result.game,
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error joining room' });
  }
});

// @route   GET /api/games/:roomId
// @desc    Get game room details
// @access  Private
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId, isActive: true });

    if (!game) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error fetching game' });
  }
});

// @route   POST /api/games/:roomId/buyin
// @desc    Buy chips for the game
// @access  Private
router.post('/:roomId/buyin', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum buy-in is 100 chips' });
    }

    const result = await GameController.buyIn(roomId, req.user._id, amount);

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Buy-in successful',
      game: result.game,
      userChips: result.user.chips,
    });
  } catch (error) {
    console.error('Buy-in error:', error);
    res.status(500).json({ message: 'Server error during buy-in' });
  }
});

// @route   POST /api/games/:roomId/leave
// @desc    Leave a game room
// @access  Private
router.post('/:roomId/leave', async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await GameController.leaveRoom(roomId, req.user._id);

    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    res.json({
      message: 'Left room successfully',
      userChips: result.user.chips,
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error leaving room' });
  }
});

// @route   GET /api/games
// @desc    Get all active games
// @access  Private
router.get('/', async (req, res) => {
  try {
    const games = await Game.find({ isActive: true }).select(
      'roomId players.username players.position stage pot maxPlayers'
    );

    res.json({ games });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Server error fetching games' });
  }
});

module.exports = router;
