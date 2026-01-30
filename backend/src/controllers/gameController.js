const Game = require('../models/Game');
const User = require('../models/User');
const {
  createDeck,
  dealCards,
  dealCommunityCards,
  findWinners,
  validateBet,
  generateRoomCode,
} = require('../utils/pokerLogic');

class GameController {
  // Create a new game room
  static async createRoom(userId, username) {
    try {
      const roomId = generateRoomCode();
      
      const game = new Game({
        roomId,
        players: [
          {
            userId,
            username,
            chips: 0, // Will be set when player buys in
            position: 0,
            cards: [],
            bet: 0,
            hasFolded: false,
            isAllIn: false,
            isSittingOut: false,
          },
        ],
        stage: 'waiting',
      });

      await game.save();
      return { success: true, game };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: error.message };
    }
  }

  // Join existing room
  static async joinRoom(roomId, userId, username) {
    try {
      const game = await Game.findOne({ roomId, isActive: true });

      if (!game) {
        return { success: false, error: 'Room not found' };
      }

      if (game.players.length >= game.maxPlayers) {
        return { success: false, error: 'Room is full' };
      }

      // Check if player already in room
      const existingPlayer = game.players.find(
        (p) => p.userId.toString() === userId.toString()
      );

      if (existingPlayer) {
        return { success: false, error: 'Already in this room' };
      }

      // Add player
      game.players.push({
        userId,
        username,
        chips: 0,
        position: game.players.length,
        cards: [],
        bet: 0,
        hasFolded: false,
        isAllIn: false,
        isSittingOut: false,
      });

      await game.save();
      return { success: true, game };
    } catch (error) {
      console.error('Error joining room:', error);
      return { success: false, error: error.message };
    }
  }

  // Player buys chips for the game
  static async buyIn(roomId, userId, amount) {
    try {
      const game = await Game.findOne({ roomId });
      const user = await User.findById(userId);

      if (!game || !user) {
        return { success: false, error: 'Game or user not found' };
      }

      if (user.chips < amount) {
        return { success: false, error: 'Not enough chips in account' };
      }

      const player = game.players.find((p) => p.userId.toString() === userId.toString());

      if (!player) {
        return { success: false, error: 'Player not in game' };
      }

      // Transfer chips from user account to game
      user.chips -= amount;
      player.chips += amount;

      await user.save();
      await game.save();

      game.addHistory('buy-in', player.username, amount);

      return { success: true, game, user };
    } catch (error) {
      console.error('Error buying in:', error);
      return { success: false, error: error.message };
    }
  }

  // Start a new hand
  static async startHand(roomId) {
    try {
      const game = await Game.findOne({ roomId });

      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      const activePlayers = game.players.filter(
        (p) => !p.isSittingOut && p.chips > 0
      );

      if (activePlayers.length < game.minPlayers) {
        return { success: false, error: 'Not enough players to start' };
      }

      // Reset round
      game.resetRound();

      // Create and shuffle deck
      const deck = createDeck();
      
      // Deal cards
      const { playerHands, remainingDeck } = dealCards(deck, activePlayers.length);

      // Assign cards to players
      activePlayers.forEach((player, index) => {
        player.cards = playerHands[index];
        player.hasFolded = false;
        player.bet = 0;
        player.isAllIn = false;
      });

      game.deck = remainingDeck;
      game.stage = 'preflop';

      // Post blinds
      const dealerIndex = game.dealerPosition;
      const sbIndex = (dealerIndex + 1) % activePlayers.length;
      const bbIndex = (dealerIndex + 2) % activePlayers.length;

      const sbPlayer = activePlayers[sbIndex];
      const bbPlayer = activePlayers[bbIndex];

      // Small blind
      const sbAmount = Math.min(game.smallBlind, sbPlayer.chips);
      sbPlayer.chips -= sbAmount;
      sbPlayer.bet = sbAmount;
      game.pot += sbAmount;

      // Big blind
      const bbAmount = Math.min(game.bigBlind, bbPlayer.chips);
      bbPlayer.chips -= bbAmount;
      bbPlayer.bet = bbAmount;
      game.pot += bbAmount;

      game.currentBet = game.bigBlind;
      game.currentPlayerIndex = (bbIndex + 1) % activePlayers.length;

      await game.save();

      game.addHistory('blinds-posted', 'System', game.smallBlind + game.bigBlind);

      return { success: true, game };
    } catch (error) {
      console.error('Error starting hand:', error);
      return { success: false, error: error.message };
    }
  }

  // Player action: fold
  static async fold(roomId, userId) {
    try {
      const game = await Game.findOne({ roomId });

      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      const player = game.players.find((p) => p.userId.toString() === userId.toString());

      if (!player) {
        return { success: false, error: 'Player not found' };
      }

      player.hasFolded = true;
      game.addHistory('fold', player.username);

      // Move to next player
      game.currentPlayerIndex = game.getNextPlayerIndex();

      // Check if hand is over
      const activePlayers = game.getActivePlayers();
      if (activePlayers.length === 1) {
        return await this.endHand(roomId);
      }

      await game.save();
      return { success: true, game };
    } catch (error) {
      console.error('Error folding:', error);
      return { success: false, error: error.message };
    }
  }

  // Player action: check/call
  static async call(roomId, userId) {
    try {
      const game = await Game.findOne({ roomId });

      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      const player = game.players.find((p) => p.userId.toString() === userId.toString());

      if (!player) {
        return { success: false, error: 'Player not found' };
      }

      const callAmount = game.currentBet - player.bet;
      const actualCall = Math.min(callAmount, player.chips);

      player.chips -= actualCall;
      player.bet += actualCall;
      game.pot += actualCall;

      if (player.chips === 0) {
        player.isAllIn = true;
      }

      const action = callAmount === 0 ? 'check' : 'call';
      game.addHistory(action, player.username, actualCall);

      // Move to next player or next stage
      game.currentPlayerIndex = game.getNextPlayerIndex();

      if (game.currentPlayerIndex === -1 || await this.isRoundComplete(game)) {
        await this.advanceStage(game);
      }

      await game.save();
      return { success: true, game };
    } catch (error) {
      console.error('Error calling:', error);
      return { success: false, error: error.message };
    }
  }

  // Player action: raise/bet
  static async raise(roomId, userId, amount) {
    try {
      const game = await Game.findOne({ roomId });

      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      const player = game.players.find((p) => p.userId.toString() === userId.toString());

      if (!player) {
        return { success: false, error: 'Player not found' };
      }

      // Validate bet
      const validation = validateBet(player, amount, game.currentBet, game.stage);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const actualRaise = Math.min(amount, player.chips);

      player.chips -= actualRaise;
      player.bet += actualRaise;
      game.pot += actualRaise;
      game.currentBet = Math.max(game.currentBet, player.bet);

      if (player.chips === 0) {
        player.isAllIn = true;
      }

      game.addHistory('raise', player.username, actualRaise);

      // Move to next player
      game.currentPlayerIndex = game.getNextPlayerIndex();

      await game.save();
      return { success: true, game };
    } catch (error) {
      console.error('Error raising:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if betting round is complete
  static async isRoundComplete(game) {
    const activePlayers = game.getActivePlayers();
    
    // All players have matched current bet or are all-in
    return activePlayers.every(
      (p) => p.bet === game.currentBet || p.isAllIn || p.chips === 0
    );
  }

  // Advance to next stage (flop, turn, river, showdown)
  static async advanceStage(game) {
    switch (game.stage) {
      case 'preflop':
        // Deal flop (3 cards)
        game.communityCards = dealCommunityCards(game.deck, game.communityCards, 3);
        game.stage = 'flop';
        break;
      case 'flop':
        // Deal turn (1 card)
        game.communityCards = dealCommunityCards(game.deck, game.communityCards, 1);
        game.stage = 'turn';
        break;
      case 'turn':
        // Deal river (1 card)
        game.communityCards = dealCommunityCards(game.deck, game.communityCards, 1);
        game.stage = 'river';
        break;
      case 'river':
        // Showdown
        game.stage = 'showdown';
        return await this.endHand(game.roomId);
      default:
        break;
    }

    // Reset bets for new round
    game.players.forEach((p) => {
      p.bet = 0;
    });
    game.currentBet = 0;
    game.currentPlayerIndex = (game.dealerPosition + 1) % game.players.length;

    return { success: true };
  }

  // End hand and determine winner
  static async endHand(roomId) {
    try {
      const game = await Game.findOne({ roomId });

      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      // Find winner(s)
      const winners = findWinners(game.players, game.communityCards);

      if (winners.length === 0) {
        return { success: false, error: 'No winners found' };
      }

      // Distribute pot
      const winAmount = Math.floor(game.pot / winners.length);

      for (const { player, hand } of winners) {
        player.chips += winAmount;

        // Update user stats
        const user = await User.findById(player.userId);
        if (user) {
          user.addGameResult('win', winAmount, hand.descr, roomId);
          await user.save();
        }

        game.addHistory('win', player.username, winAmount);
      }

      game.winner = {
        userId: winners[0].player.userId,
        username: winners[0].player.username,
        hand: winners[0].hand.descr,
        amount: winAmount,
      };

      game.stage = 'ended';
      await game.save();

      return { success: true, game, winners };
    } catch (error) {
      console.error('Error ending hand:', error);
      return { success: false, error: error.message };
    }
  }

  // Leave game
  static async leaveRoom(roomId, userId) {
    try {
      const game = await Game.findOne({ roomId });
      const user = await User.findById(userId);

      if (!game || !user) {
        return { success: false, error: 'Game or user not found' };
      }

      const playerIndex = game.players.findIndex(
        (p) => p.userId.toString() === userId.toString()
      );

      if (playerIndex === -1) {
        return { success: false, error: 'Player not in game' };
      }

      const player = game.players[playerIndex];

      // Return chips to user account
      if (player.chips > 0) {
        user.chips += player.chips;
        await user.save();
      }

      // Remove player
      game.players.splice(playerIndex, 1);

      // If no players left, deactivate game
      if (game.players.length === 0) {
        game.isActive = false;
      }

      await game.save();
      game.addHistory('leave', player.username);

      return { success: true, game, user };
    } catch (error) {
      console.error('Error leaving room:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = GameController;
