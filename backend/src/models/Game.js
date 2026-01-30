const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        username: String,
        chips: Number,
        position: Number, // 0-7 for seat position
        cards: [String], // Player's hole cards ['As', 'Kh']
        bet: {
          type: Number,
          default: 0,
        },
        hasFolded: {
          type: Boolean,
          default: false,
        },
        isAllIn: {
          type: Boolean,
          default: false,
        },
        isSittingOut: {
          type: Boolean,
          default: false,
        },
      },
    ],
    deck: [String], // Remaining cards in deck
    communityCards: [String], // Flop, turn, river
    pot: {
      type: Number,
      default: 0,
    },
    currentBet: {
      type: Number,
      default: 0,
    },
    currentPlayerIndex: {
      type: Number,
      default: 0,
    },
    dealerPosition: {
      type: Number,
      default: 0,
    },
    smallBlind: {
      type: Number,
      default: 5,
    },
    bigBlind: {
      type: Number,
      default: 10,
    },
    stage: {
      type: String,
      enum: ['waiting', 'preflop', 'flop', 'turn', 'river', 'showdown', 'ended'],
      default: 'waiting',
    },
    minPlayers: {
      type: Number,
      default: 2,
    },
    maxPlayers: {
      type: Number,
      default: 8,
    },
    history: [
      {
        action: String,
        player: String,
        amount: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    winner: {
      userId: String,
      username: String,
      hand: String,
      amount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Method to get active players
gameSchema.methods.getActivePlayers = function () {
  return this.players.filter((p) => !p.hasFolded && !p.isSittingOut);
};

// Method to get next active player
gameSchema.methods.getNextPlayerIndex = function () {
  const activePlayers = this.getActivePlayers();
  if (activePlayers.length <= 1) return -1;

  let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
  let attempts = 0;

  while (attempts < this.players.length) {
    const player = this.players[nextIndex];
    if (player && !player.hasFolded && !player.isSittingOut && !player.isAllIn) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % this.players.length;
    attempts++;
  }

  return -1;
};

// Method to add action to history
gameSchema.methods.addHistory = function (action, player, amount = 0) {
  this.history.push({
    action,
    player,
    amount,
    timestamp: new Date(),
  });

  // Keep only last 50 actions
  if (this.history.length > 50) {
    this.history = this.history.slice(-50);
  }
};

// Method to reset round
gameSchema.methods.resetRound = function () {
  this.communityCards = [];
  this.pot = 0;
  this.currentBet = 0;
  this.stage = 'preflop';
  
  this.players.forEach((player) => {
    player.cards = [];
    player.bet = 0;
    player.hasFolded = false;
    player.isAllIn = false;
  });

  // Move dealer button
  this.dealerPosition = (this.dealerPosition + 1) % this.players.length;
};

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
