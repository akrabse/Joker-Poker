const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  chips: {
    type: Number,
    default: 500,
    min: 0
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    totalProfit: {
      type: Number,
      default: 0
    },
    handsPlayed: {
      type: Number,
      default: 0
    },
    handsWon: {
      type: Number,
      default: 0
    },
    handsLost: {
      type: Number,
      default: 0
    }
  },
  gameHistory: {
    type: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      result: String,  // 'win', 'loss', 'draw'
      amount: Number,
      roomId: String
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual field for net profit/loss calculation
userSchema.virtual('netProfitLoss').get(function() {
  return this.stats.totalProfit || 0;
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Index for faster queries
// Note: `unique: true` already creates an index for username. Avoid duplicate index declaration.

module.exports = mongoose.model('User', userSchema);