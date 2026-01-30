const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    passwordHash: {
      type: String,
      required: function() {
        return !this.isGuest;
      },
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    chips: {
      type: Number,
      default: 500,
      min: [0, 'Chips cannot be negative'],
    },
    stats: {
      handsPlayed: {
        type: Number,
        default: 0,
      },
      handsWon: {
        type: Number,
        default: 0,
      },
      handsLost: {
        type: Number,
        default: 0,
      },
      totalWinnings: {
        type: Number,
        default: 0,
      },
      totalLosses: {
        type: Number,
        default: 0,
      },
      biggestWin: {
        type: Number,
        default: 0,
      },
      biggestLoss: {
        type: Number,
        default: 0,
      },
    },
    gameHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        result: {
          type: String,
          enum: ['win', 'loss', 'fold'],
        },
        amount: {
          type: Number,
          default: 0,
        },
        hand: String,
        roomId: String,
      },
    ],
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentRoomId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || this.isGuest) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to add game result to history
userSchema.methods.addGameResult = function (result, amount, hand, roomId) {
  this.gameHistory.push({
    timestamp: new Date(),
    result,
    amount,
    hand,
    roomId,
  });

  // Keep only last 100 games
  if (this.gameHistory.length > 100) {
    this.gameHistory = this.gameHistory.slice(-100);
  }

  // Update stats
  this.stats.handsPlayed += 1;
  
  if (result === 'win') {
    this.stats.handsWon += 1;
    this.stats.totalWinnings += amount;
    if (amount > this.stats.biggestWin) {
      this.stats.biggestWin = amount;
    }
  } else if (result === 'loss') {
    this.stats.handsLost += 1;
    this.stats.totalLosses += amount;
    if (amount > this.stats.biggestLoss) {
      this.stats.biggestLoss = amount;
    }
  }
};

// Virtual for net profit/loss
userSchema.virtual('netProfitLoss').get(function () {
  return this.stats.totalWinnings - this.stats.totalLosses;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
