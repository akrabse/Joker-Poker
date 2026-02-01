const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration - allow requests from frontend
const allowedOrigins = [
  'https://joker-poker-theta.vercel.app',
  'https://joker-poker-theta.vercel.app/',
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware - CORS for Express routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Remove trailing slash for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigins.map(o => o?.replace(/\/$/, ''));
    
    if (normalizedAllowed.indexOf(normalizedOrigin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected:', mongoose.connection.host))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

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
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: allowedOrigins,
      frontendUrl: process.env.FRONTEND_URL
    }
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
  console.log(`║ Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log('║ Socket.io: Connected');
  console.log('║ CORS: Configured');
  console.log('╚════════════════════════════════════════╝\n');
});

module.exports = { app, server, io };