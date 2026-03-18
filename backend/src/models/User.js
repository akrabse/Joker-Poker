/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * Dit is de blauwdruk (Schema) voor een speler account. In de MongoDB database wordt iedere
 * speler vastgelegd met een unieke gebruikersnaam, een versleuteld wachtwoord,
 * en worden de gewonnen en verloren spelletjes opgeslagen om statistieken in te kunnen zien.
 */
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
      roomId: String,
      hand: String
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

// Method to add game result
// UITLEG: Hiermee kan aan het eind van iedere hand het resultaat en nieuwe saldo fiches direct bij de speler worden weggeschreven in de database.
userSchema.methods.addGameResult = function (result, amount, hand, roomId) {
  this.gameHistory.push({
    result,
    amount,
    hand,
    roomId,
    timestamp: new Date()
  });

  // Keep only last 50 games
  if (this.gameHistory.length > 50) {
    this.gameHistory = this.gameHistory.slice(-50);
  }

  // Update stats
  this.stats.gamesPlayed += 1;
  this.stats.handsPlayed += 1; // Sync these for now as one hand = one 'game' result in this context
  this.stats.totalProfit += amount;

  if (result === 'win') {
    this.stats.gamesWon += 1;
    this.stats.handsWon += 1;
  } else if (result === 'loss') {
    this.stats.handsLost += 1;
  }
};

// Virtual field for net profit/loss calculation
userSchema.virtual('netProfitLoss').get(function () {
  return this.stats.totalProfit || 0;
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Index for faster queries
// Note: `unique: true` already creates an index for username. Avoid duplicate index declaration.

module.exports = mongoose.model('User', userSchema);