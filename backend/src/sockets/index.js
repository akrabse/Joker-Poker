const GameController = require('../controllers/gameController');
const User = require('../models/User');
const Game = require('../models/Game');

// Helper to sanitize game object for a specific user
const sanitizeGameForUser = (game, userId) => {
  if (!game) return null;
  const gameObj = game.toObject ? game.toObject() : { ...game };

  // Hide other players' cards unless showdown or ended
  if (gameObj.stage !== 'showdown' && gameObj.stage !== 'ended') {
    gameObj.players = gameObj.players.map(p => {
      if (p.userId.toString() !== userId?.toString()) {
        return { ...p, cards: [] }; // Hide cards
      }
      return p;
    });
  }
  return gameObj;
};

module.exports = (io) => {
  // Store connected users
  const connectedUsers = new Map(); // socketId -> { userId, username, roomId }

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

        if (!game) {
          console.error(`❌ Game not found for room: ${roomId}`);
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (!user) {
          console.error(`❌ User not found: ${userId}`);
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Check if player is already in the game
        const existingPlayer = game.players?.find(p => p.userId.toString() === userId.toString());

        // Log game state for debugging
        console.log(`📊 Player state:`, {
          username,
          accountChips: user.chips,
          gameChips: existingPlayer?.chips || 0,
          totalPlayersInRoom: game.players.length,
          alreadyInRoom: !!existingPlayer
        });

        // Only notify room if this is a new player joining (not reconnecting/refreshing)
        if (!existingPlayer) {
          io.to(roomId).emit('message', {
            username,
            text: `${username} joined the table`,
            type: 'system',
          });
        }

        // Send current game state to joining player with updated user data
        // We must send sanitized state to EACH client in the room
        const clients = io.sockets.adapter.rooms.get(roomId);
        if (clients) {
          for (const clientId of clients) {
            const clientSocket = io.sockets.sockets.get(clientId);
            if (clientSocket) {
              const clientData = connectedUsers.get(clientId);
              // If we can't identify user (e.g. they just connected and haven't sent ID), send fully masked
              const uid = clientData ? clientData.userId : null;
              clientSocket.emit('gameState', { game: sanitizeGameForUser(game, uid) });
            }
          }
        }
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

          io.to(roomId).emit('message', {
            username,
            text: `${username} left the table`,
            type: 'system',
          });

          // Broadcast sanitized update
          const clients = io.sockets.adapter.rooms.get(roomId);
          if (clients) {
            for (const clientId of clients) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket) {
                const clientData = connectedUsers.get(clientId);
                const uid = clientData ? clientData.userId : null;
                clientSocket.emit('gameState', { game: sanitizeGameForUser(result.game, uid) });
              }
            }
          }

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

          // Send sanitized game state to each player
          const clients = io.sockets.adapter.rooms.get(roomId);
          if (clients) {
            for (const clientId of clients) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket) {
                const clientData = connectedUsers.get(clientId);
                const uid = clientData ? clientData.userId : null;
                clientSocket.emit('handStarted', { game: sanitizeGameForUser(result.game, uid) });
              }
            }
          }

          // Send private cards to each player (redundant but explicit for hand start)
          result.game.players.forEach((player) => {
            const playerSocket = Array.from(connectedUsers.entries()).find(
              ([_, data]) => data.userId === player.userId.toString()
            );
            if (playerSocket) {
              io.to(playerSocket[0]).emit('privateCards', { cards: player.cards });
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
          // Broadcast sanitized update
          const clients = io.sockets.adapter.rooms.get(roomId);
          if (clients) {
            for (const clientId of clients) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket) {
                const clientData = connectedUsers.get(clientId);
                const uid = clientData ? clientData.userId : null;
                clientSocket.emit('playerAction', { action: 'fold', game: sanitizeGameForUser(result.game, uid) });
              }
            }
          }

          // Check if hand ended
          if (result.game.stage === 'showdown' || result.game.stage === 'ended') {
            await handleHandEnd(result.game, io, connectedUsers, roomId);
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
          // Broadcast sanitized update
          const clients = io.sockets.adapter.rooms.get(roomId);
          if (clients) {
            for (const clientId of clients) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket) {
                const clientData = connectedUsers.get(clientId);
                const uid = clientData ? clientData.userId : null;
                clientSocket.emit('playerAction', {
                  action: result.game.currentBet === 0 ? 'check' : 'call',
                  game: sanitizeGameForUser(result.game, uid)
                });
              }
            }
          }

          // Check if stage advanced
          if (result.game.stage === 'showdown' || result.game.stage === 'ended') {
            await handleHandEnd(result.game, io, connectedUsers, roomId);
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
          // Broadcast sanitized update
          const clients = io.sockets.adapter.rooms.get(roomId);
          if (clients) {
            for (const clientId of clients) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket) {
                const clientData = connectedUsers.get(clientId);
                const uid = clientData ? clientData.userId : null;
                clientSocket.emit('playerAction', {
                  action: 'raise',
                  amount,
                  game: sanitizeGameForUser(result.game, uid)
                });
              }
            }
          }
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

          // Broadcast sanitized update
          const clients = io.sockets.adapter.rooms.get(roomId);
          if (clients) {
            for (const clientId of clients) {
              const clientSocket = io.sockets.sockets.get(clientId);
              if (clientSocket) {
                const clientData = connectedUsers.get(clientId);
                const uid = clientData ? clientData.userId : null;
                clientSocket.emit('gameUpdate', { game: sanitizeGameForUser(result.game, uid) });
              }
            }
          }

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
        const userData = connectedUsers.get(socket.id);
        const uid = userData ? userData.userId : null;
        socket.emit('gameState', { game: sanitizeGameForUser(game, uid) });
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
            // Broadcast sanitized update
            const clients = io.sockets.adapter.rooms.get(roomId);
            if (clients) {
              for (const clientId of clients) {
                const clientSocket = io.sockets.sockets.get(clientId);
                if (clientSocket) {
                  const clientData = connectedUsers.get(clientId);
                  const uid = clientData ? clientData.userId : null;
                  clientSocket.emit('gameState', { game: sanitizeGameForUser(result.game, uid) });
                }
              }
            }

            if (result.game.stage === 'showdown' || result.game.stage === 'ended') {
              handleHandEnd(result.game, io, connectedUsers, roomId);
            }
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


// Helper: Handle Hand End and Auto-Restart
async function handleHandEnd(game, io, connectedUsers, roomId) {
  // 1. Sync Chips
  await syncUserChipsAfterHand(game, io, connectedUsers);

  // 2. Notify detailed result (Showdown)
  // For showdown, we can send the full game because cards are public
  io.to(roomId).emit('handEnded', {
    game: game, // Showdown = public cards
    winner: game.winner,
  });

  // 3. Auto-Restart Loop (8 seconds delay)
  const GameController = require('../controllers/gameController'); // Lazy import if needed or use global

  console.log(`⏳ Auto-restarting game in ${roomId} in 8 seconds...`);
  setTimeout(async () => {
    try {
      // Re-fetch game to ensure it's still valid/active
      const Game = require('../models/Game');
      const currentGame = await Game.findOne({ roomId });
      if (!currentGame || !currentGame.isActive) return;

      // Start Hand
      const result = await GameController.startHand(roomId);
      if (result.success) {
        console.log(`🔄 Auto-started new hand in ${roomId}`);
        io.to(roomId).emit('handStarted', { game: result.game });

        // Send private cards
        result.game.players.forEach((player) => {
          const playerSocket = Array.from(connectedUsers.entries()).find(
            ([_, data]) => data.userId === player.userId.toString()
          );
          if (playerSocket) {
            io.to(playerSocket[0]).emit('privateCards', { cards: player.cards });
          }
        });

        io.to(roomId).emit('message', { text: 'New hand started!', type: 'system' });
      } else {
        console.log(`⚠️ Auto-start skipped: ${result.error}`);
        // Optional: Emit waiting status?
      }
    } catch (e) {
      console.error('❌ Auto-restart error:', e);
    }
  }, 8000);
}

module.exports = initializeSocket;