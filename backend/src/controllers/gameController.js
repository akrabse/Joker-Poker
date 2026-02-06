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
  // Create a new game room with automatic chip transfer
  static async createRoom(userId, username) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.chips <= 0) {
        return { success: false, error: 'You need chips in your account to create a room' };
      }

      const roomId = generateRoomCode();

      // No initial chip transfer - manual buy-in required
      // const initialChips = user.chips;
      // user.chips = 0; 
      // await user.save();

      const game = new Game({
        roomId,
        players: [
          {
            userId,
            username,
            chips: 0, // Manual buy-in required
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

      console.log(`🎲 Room created: ${roomId} | Player: ${username}`);

      return { success: true, game, user };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: error.message };
    }
  }

  // Join existing room with automatic chip transfer
  static async joinRoom(roomId, userId, username) {
    try {
      const game = await Game.findOne({ roomId, isActive: true });
      const user = await User.findById(userId);

      if (!game) {
        return { success: false, error: 'Room not found' };
      }

      if (!user) {
        return { success: false, error: 'User not found' };
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

      // Add player with chips
      game.players.push({
        userId,
        username,
        chips: 0, // Manual buy-in required
        position: -1, // Will be set when sitting down
        cards: [],
        bet: 0,
        hasFolded: false,
        isAllIn: false,
        isSittingOut: false,
        // If game is running, join as folded
        hasFolded: game.stage !== 'waiting',
      });

      await game.save();

      console.log(`👤 Player joined: ${username} | Room: ${roomId}`);

      return { success: true, game, user };
    } catch (error) {
      console.error('Error joining room:', error);
      return { success: false, error: error.message };
    }
  }

  // Player buys chips for the game (optional top-up)
  static async buyIn(roomId, userId, amount) {
    try {
      const buyInAmount = parseInt(amount);

      if (isNaN(buyInAmount) || buyInAmount <= 0) {
        return { success: false, error: 'Invalid buy-in amount' };
      }

      const game = await Game.findOne({ roomId });
      const user = await User.findById(userId);

      if (!game || !user) {
        return { success: false, error: 'Game or user not found' };
      }

      if (user.chips < buyInAmount) {
        return { success: false, error: 'Not enough chips in account' };
      }

      const player = game.players.find((p) => p.userId.toString() === userId.toString());

      if (!player) {
        return { success: false, error: 'Player not in game' };
      }

      // Transfer chips from user account to game
      user.chips -= buyInAmount;
      player.chips += buyInAmount;

      game.markModified('players');
      await user.save();
      await game.save();

      game.addHistory('buy-in', player.username, buyInAmount);

      console.log(`💰 Additional buy-in: ${player.username} | Amount: ${buyInAmount} | New total: ${player.chips}`);

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
        return await this.endHand(game);
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

      player.hasActed = true;

      // Move to next player or next stage
      game.currentPlayerIndex = game.getNextPlayerIndex();

      if (game.stage === 'ended') {
        return { success: false, error: 'Game has already ended' };
      }

      if (game.currentPlayerIndex === -1 || await this.isRoundComplete(game)) {
        return await this.advanceStage(game);
      }

      game.markModified('players');
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

      // Player has acted, but others must act again because of the raise
      player.hasActed = true;
      game.players.forEach(p => {
        if (p.userId.toString() !== userId.toString()) {
          p.hasActed = false;
        }
      });

      // Move to next player
      game.currentPlayerIndex = game.getNextPlayerIndex();

      game.markModified('players');
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

    // Logic: Everyone must have matched the current bet (or be all-in/zero chips) AND everyone must have acted at least once
    // Just checking bet === currentBet isn't enough because initially everyone has 0 bet and 0 currentBet
    // We need to track if players have acted, but since we don't have a 'hasActed' flag in the model yet,
    // we rely on the fact that if currentBet is 0, everyone checking means we advance.
    // BUT: The bug described is "when 1 person checks it allows them to keep checking". 
    // This implies the turn isn't advancing or the round isn't ending.

    // Real fix: Ensure we cycle through all players. The logic here:
    // "activePlayers.every(p => p.bet === game.currentBet)" returns true immediately if everyone checks (bet=0, curr=0).
    // This causes the round to end instantly after the first check if we aren't careful?
    // Actually, if everyone checks, the round SHOULD end.
    // The issue "1 person checks it allows them to keep checking" suggests `currentPlayerIndex` isn't updating correctly or 
    // the game loop is stuck on the same player.

    // Let's rely on `advanceStage` resetting `currentPlayerIndex` correctly. 
    // If everyone calls/checks, we move to next stage.

    return activePlayers.every(
      (p) => (p.bet === game.currentBet && p.hasActed) || p.isAllIn || p.chips === 0
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
        return await this.endHand(game);
      case 'showdown':
        // Safety: If somehow still in showdown, end it
        return await this.endHand(game);
      default:
        break;
    }

    // Reset bets for new round
    game.players.forEach((p) => {
      p.bet = 0;
      p.hasActed = false;
    });
    game.currentBet = 0;
    game.currentPlayerIndex = (game.dealerPosition + 1) % game.players.length;

    return { success: true };
  }

  // End hand and determine winner
  static async endHand(game) {
    try {
      if (!game) {
        return { success: false, error: 'Game object required' };
      }

      // Find winner(s)
      const winners = findWinners(game.players, game.communityCards);

      if (winners.length === 0) {
        return { success: false, error: 'No winners found' };
      }

      // Mark winner's cards to be shown
      const winnerIds = new Set(winners.map(w => w.player.userId.toString()));
      winners.forEach(w => {
        const player = game.players.find(p => p.userId.toString() === w.player.userId.toString());
        if (player) player.showHand = true;
      });

      // Distribute pot and record winner stats
      const winAmount = Math.floor(game.pot / winners.length);

      for (const { player, hand } of winners) {
        const playerInGame = game.players.find(p => p.userId.toString() === player.userId.toString());
        playerInGame.chips += winAmount;

        // Update user stats
        const user = await User.findById(player.userId);
        if (user) {
          user.addGameResult('win', winAmount, hand.descr, game.roomId);
          await user.save();
        }

        game.addHistory('win', player.username, winAmount);
      }

      // Record losses for other active players
      const nonWinners = game.players.filter(p => !p.hasFolded && !winnerIds.has(p.userId.toString()));
      for (const loser of nonWinners) {
        // Evaluate their best hand even if they lost
        const result = evaluateHand(loser.cards, game.communityCards);

        const user = await User.findById(loser.userId);
        if (user) {
          user.addGameResult('loss', 0, result.descr, game.roomId);
          await user.save();
        }
      }

      const topWinner = winners[0];
      game.winner = {
        userId: topWinner.player.userId.toString(),
        username: topWinner.player.username,
        hand: topWinner.hand.descr || topWinner.hand.name || 'Winner',
        amount: winAmount,
      };

      game.stage = 'ended';
      game.markModified('players');
      game.markModified('winner');
      await game.save();

      console.log(`🏆 Hand ended. Winner: ${game.winner.username} (${game.winner.hand}) | Amount: ${game.winner.amount}`);

      return { success: true, game, winners };
    } catch (error) {
      console.error('Error ending hand:', error);
      return { success: false, error: error.message };
    }
  }

  // Leave game - return chips to user account
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
        console.log(`💸 Chips returned: ${player.username} | Amount: ${player.chips} | New balance: ${user.chips}`);
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