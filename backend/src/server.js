require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initializeSocket = require('./sockets');

const PORT = process.env.PORT || 10000;

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://joker-poker-theta.vercel.app/']
      : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket handlers
initializeSocket(io);

// Start server
server.listen(PORT, ('0.0.0.0') => {
  console.log(`
╔════════════════════════════════════════╗
║     🃏 Joker Poker Server Running     ║
╠════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}                    
║  Port: ${PORT}                              
║  API: http://localhost:${PORT}          
║  Socket.io: Connected                  
╚════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = server;
