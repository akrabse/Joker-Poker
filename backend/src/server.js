const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected:', mongoose.connection.host))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Root endpoint - to verify server is running
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Joker Poker Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      game: '/api/game'
    },
    documentation: 'Use /health to check server status'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Socket.io connection
const initializeSocket = require('./sockets/index');
initializeSocket(io);

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      root: 'GET /',
      health: 'GET /health',
      auth: 'POST /api/auth/login, POST /api/auth/register',
      game: 'GET /api/game/*'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║ 🃏 Joker Poker Server Running         ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`║ Port: ${PORT}`);
  console.log(`║ API: http://localhost:${PORT}`);
  console.log('║ Socket.io: Connected');
  console.log('╚════════════════════════════════════════╝\n');
});

module.exports = { app, server, io };