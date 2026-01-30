const GameController = require('../controllers/gameController');
const User = require('../models/User');
const Game = require('../models/Game');

const initializeSocket = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Join room
    socket.on('joinRoom', async ({ roomId, userId, username }) => {
      try {
        socket.join(roomId);
        connectedUsers.set(socket.id, { roomId, userId, username });

        console.log(`${username} joined room ${roomId}`);

        // Update user online status
        await User.findByIdAndUpdate(userId, { 
          isOnline: true,
          currentRoomId: roomId 
        });

        // Get current game state
        const game = await Game.findOne({ roomId });

        // Notify room
        io.to(roomId).emit('playerJoined', {
          username,
          game,
          message: `${username} joined the table`,
        });

        // Send current game state to joining player
        socket.emit('gameState', { game });
      } catch (error) {
        console.error('Error joining room:', error);
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

          io.to(roomId).emit('playerLeft', {
            username,
            game: result.game,
            message: `${username} left the table`,
          });

          socket.emit('leftRoom', { 
            message: 'Successfully left room',
            userChips: result.user.chips 
          });
        }
      } catch (error) {
        console.error('Error leaving room:', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    // Start hand
    socket.on('startHand', async ({ roomId }) => {
      try {
        const result = await GameController.startHand(roomId);

        if (result.success) {
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
          io.to(roomId).emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Error starting hand:', error);
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
            io.to(roomId).emit('handEnded', {
              game: result.game,
              winner: result.game.winner,
            });
          }
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Error folding:', error);
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
            io.to(roomId).emit('handEnded', {
              game: result.game,
              winner: result.game.winner,
            });
          }
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Error calling:', error);
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
        console.error('Error raising:', error);
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
        console.error('Error sending chat:', error);
      }
    });

    // Buy-in
    socket.on('buyIn', async ({ roomId, userId, amount }) => {
      try {
        const result = await GameController.buyIn(roomId, userId, amount);

        if (result.success) {
          io.to(roomId).emit('playerBuyIn', {
            game: result.game,
            message: `Player bought ${amount} chips`,
          });

          socket.emit('buyInSuccess', {
            userChips: result.user.chips,
            gameChips: result.game.players.find(
              (p) => p.userId.toString() === userId
            ).chips,
          });
        } else {
          socket.emit('error', { message: result.error });
        }
      } catch (error) {
        console.error('Error buying in:', error);
        socket.emit('error', { message: 'Failed to buy in' });
      }
    });

    // Request game state
    socket.on('requestGameState', async ({ roomId }) => {
      try {
        const game = await Game.findOne({ roomId });
        socket.emit('gameState', { game });
      } catch (error) {
        console.error('Error getting game state:', error);
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
          // Update user online status
          await User.findByIdAndUpdate(userId, { 
            isOnline: false 
          });

          // Notify room
          io.to(roomId).emit('playerDisconnected', {
            username,
            message: `${username} disconnected`,
          });

          connectedUsers.delete(socket.id);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });

  return io;
};

module.exports = initializeSocket;
