const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Simplified CORS - allow your frontend domain
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow any vercel.app subdomain and your specific frontend
    if (origin.includes('vercel.app') || 
        origin.includes('localhost') ||
        origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const io = socketIo(server, {
  cors: {
    origin: true, // Allow all origins for Socket.io
    credentials: true
  }
});

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected:', mongoose.connection.host))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Joker Poker Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      game: '/api/game'
    }
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
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
  console.log('║ CORS: Permissive (vercel.app allowed)');
  console.log('╚════════════════════════════════════════╝\n');
});

module.exports = { app, server, io };
