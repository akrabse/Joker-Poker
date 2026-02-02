const GameController = require('../controllers/gameController');
const User = require('../models/User');
const Game = require('../models/Game');

const initializeSocket = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Join room - chips transfer automatically in controller
    socket.on('joinRoom', async ({ roomId, userId, username }) => {
      try {
        socket.join(roomId);
        connectedUsers.set(socket.id, { roomId, userId, username });

        console.log(`👤 ${username} connecting to room ${roomId}`);

        // Update user online status
        await User.findByIdAndUpdate(userId, { 
          isOnline: true,
          currentRoomId: roomId 
        });

        // Get current game state
        const game = await Game.findOne({ roomId });
        const user = await User.findById(userId);

        // Check if player is already in the game
        const existingPlayer = game?.players.find(p => p.userId.toString() === userId.toString());

        // Log game state for debugging
        if (game) {
          console.log(`📊 Player state:`, {
            username,
            accountChips: user?.chips || 0,
            gameChips: existingPlayer?.chips || 0,
            totalPlayersInRoom: game.players.length,
            alreadyInRoom: !!existingPlayer
          });
        }

        // Only notify room if this is a new player joining (not reconnecting/refreshing)
        if (!existingPlayer) {
          io.to(roomId).emit('playerJoined', {
            username,
            game,
            message: `${username} joined the table`,
          });
        }

        // Send current game state to joining player with updated user data
        socket.emit('gameState', { game });
        socket.emit('userUpdate', { chips: user.chips });
      } catch (error) {
        console.error('❌ Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leaveRoom', async ({ roomId, userId, username }) => {
      try {
        const result = await GameController.leaveRoom(roomId, userId);

        if (result.success) {
          socket.leave(roomId);
          connectedUsers.delete(socket.id);

          // Update user status
          await User.findByIdAndUpdate(userId, { 
            isOnline: false,
            currentRoomId: null 
          });

          console.log(`👋 ${username} left room ${roomId}`);

          io.to(roomId).emit('playerLeft', {
            username,
            game: result.game,
            message: `${username} left the table`,
          });

          socket.emit('leftRoom', { 
            message: 'Successfully left room',
            userChips: result.user.chips 
          });
          
          // Send updated user data
          socket.emit('userUpdate', { chips: result.user.chips });
        }
      } catch (error) {
        console.error('❌ Error leaving room:', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    // Start hand
    socket.on('startHand', async ({ roomId }) => {
      try {
        console.log(`🎲 Attempting to start hand in room ${roomId}`);
        
        const game = await Game.findOne({ roomId });
        if (game) {
          const activePlayers = game.players.filter(p => !p.isSittingOut && p.chips > 0);
          console.log(`📊 Pre-start check:`, {
            totalPlayers: game.players.length,
            playersWithChips: activePlayers.length,
            minPlayersNeeded: game.minPlayers,
            playerChips: game.players.map(p => ({ username: p.username, chips: p.chips }))
          });
        }
        
        const result = await GameController.startHand(roomId);

        if (result.success) {
          console.log(`✅ Hand started successfully in room ${roomId}`);
          
          // Send game state to all players
          io.to(roomId).emit('handStarted', { game: result.game });

          // Send private cards to each player
          result.game.players.forEach((player) => {
            const playerSocket = Array.from(connectedUsers.entries()).find(
              ([_, data]) => data.userId === player.userId.toString()
            );

            if (playerSocket) {
              io.to(playerSocket[0]).emit('privateCards', {
                cards: player.cards,
              });
            }
          });

          io.to(roomId).emit('message', { 
            text: 'New hand started!',
            type: 'system' 
          });
        } else {
          console.log(`❌ Failed to start hand in room ${roomId}: ${result.error}`);
          io.to(roomId).emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Error starting hand:', error);
        io.to(roomId).emit('error', { message: 'Failed to start hand' });
      }
    });

    // Player fold
    socket.on('fold', async ({ roomId, userId }) => {
      try {
        const result = await GameController.fold(roomId, userId);

        if (result.success) {
          io.to(roomId).emit('playerAction', {
            action: 'fold',
            game: result.game,
          });

          // Check if hand ended
          if (result.game.stage === 'ended') {
            // Update user chips in database for all players
            await syncUserChipsAfterHand(result.game, io, connectedUsers);
            
            io.to(roomId).emit('handEnded', {
              game: result.game,
              winner: result.game.winner,
            });
          }
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Error folding:', error);
        socket.emit('error', { message: 'Failed to fold' });
      }
    });

    // Player call/check
    socket.on('call', async ({ roomId, userId }) => {
      try {
        const result = await GameController.call(roomId, userId);

        if (result.success) {
          io.to(roomId).emit('playerAction', {
            action: result.game.currentBet === 0 ? 'check' : 'call',
            game: result.game,
          });

          // Check if stage advanced
          if (result.game.stage === 'ended') {
            // Update user chips in database for all players
            await syncUserChipsAfterHand(result.game, io, connectedUsers);
            
            io.to(roomId).emit('handEnded', {
              game: result.game,
              winner: result.game.winner,
            });
          }
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Error calling:', error);
        socket.emit('error', { message: 'Failed to call' });
      }
    });

    // Player raise
    socket.on('raise', async ({ roomId, userId, amount }) => {
      try {
        const result = await GameController.raise(roomId, userId, amount);

        if (result.success) {
          io.to(roomId).emit('playerAction', {
            action: 'raise',
            amount,
            game: result.game,
          });
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Error raising:', error);
        socket.emit('error', { message: 'Failed to raise' });
      }
    });

    // Chat message
    socket.on('chatMessage', ({ roomId, userId, username, message }) => {
      try {
        io.to(roomId).emit('message', {
          userId,
          username,
          text: message,
          timestamp: new Date(),
          type: 'chat',
        });
      } catch (error) {
        console.error('❌ Error sending chat:', error);
      }
    });

    // Buy-in (optional top-up)
    socket.on('buyIn', async ({ roomId, userId, amount }) => {
      try {
        console.log(`💰 Player ${userId} attempting to buy ${amount} chips in room ${roomId}`);
        
        const result = await GameController.buyIn(roomId, userId, amount);

        if (result.success) {
          const player = result.game.players.find(p => p.userId.toString() === userId);
          console.log(`✅ Buy-in successful. Player now has ${player?.chips} chips in game`);
          
          io.to(roomId).emit('playerBuyIn', {
            game: result.game,
            message: `Player bought ${amount} chips`,
          });

          io.to(roomId).emit('gameState', { game: result.game });

          socket.emit('buyInSuccess', {
            userChips: result.user.chips,
            gameChips: result.game.players.find(
              (p) => p.userId.toString() === userId
            ).chips,
          });
          
          // Send updated user data
          socket.emit('userUpdate', { chips: result.user.chips });
        } else {
          console.log(`❌ Buy-in failed: ${result.error}`);
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('❌ Error buying in:', error);
        socket.emit('error', { message: 'Failed to buy in' });
      }
    });

    // Request game state
    socket.on('requestGameState', async ({ roomId }) => {
      try {
        const game = await Game.findOne({ roomId });
        socket.emit('gameState', { game });
      } catch (error) {
        console.error('❌ Error getting game state:', error);
        socket.emit('error', { message: 'Failed to get game state' });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      const userData = connectedUsers.get(socket.id);
      if (userData) {
        const { roomId, userId, username } = userData;

        try {
          // Actually remove player from game
          const result = await GameController.leaveRoom(roomId, userId);

          // Update user online status
          await User.findByIdAndUpdate(userId, { 
            isOnline: false,
            currentRoomId: null
          });

          console.log(`👋 ${username} disconnected from room ${roomId}`);

          // Notify room with updated game state
          if (result.success) {
            io.to(roomId).emit('playerLeft', {
              username,
              game: result.game,
              message: `${username} disconnected`,
            });

            io.to(roomId).emit('gameState', { game: result.game });
            
          } else {
            io.to(roomId).emit('playerDisconnected', {
              username,
              message: `${username} disconnected`,
            });
          }

          connectedUsers.delete(socket.id);
        } catch (error) {
          console.error('❌ Error handling disconnect:', error);
          connectedUsers.delete(socket.id);
        }
      }
    });
  });

  return io;
};

// Helper function to sync user account chips after hand ends
async function syncUserChipsAfterHand(game, io, connectedUsers) {
  try {
    console.log('🔄 Syncing user chips after hand...');
    
    for (const player of game.players) {
      const user = await User.findById(player.userId);
      if (user) {
        // Update user account chips to match game chips
        user.chips = player.chips;
        await user.save();
        
        console.log(`💾 Synced chips for ${player.username}: ${player.chips}`);
        
        // Find player's socket and send update
        const playerSocket = Array.from(connectedUsers.entries()).find(
          ([_, data]) => data.userId === player.userId.toString()
        );
        
        if (playerSocket) {
          io.to(playerSocket[0]).emit('userUpdate', { chips: user.chips });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error syncing user chips:', error);
  }
}

module.exports = initializeSocket;