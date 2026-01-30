# Joker Poker - Multiplayer Poker Game

A real-time multiplayer Texas Hold'em poker game built with React, Node.js, Socket.io, and MongoDB.

## Features

- 🃏 Real-time multiplayer poker (up to 8 players per table)
- 💬 In-game chat
- 📊 Player statistics tracking (hands won/lost, profit/loss)
- 🎨 Modern, animated UI with smooth transitions
- 🔐 User authentication system
- 👨‍💼 Admin panel for managing player chips
- 🎲 Complete Texas Hold'em poker logic
- 📱 Responsive design

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Framer Motion for animations
- Socket.io-client for real-time communication
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.io for WebSocket connections
- JWT for authentication
- bcrypt for password hashing

## Project Structure

```
Joker/
├── frontend/          # React application
│   ├── public/        # Static assets
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Main page components
│   │   ├── utils/       # Helper functions
│   │   └── styles/      # CSS files
│   └── package.json
├── backend/           # Node.js server
│   ├── src/
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   ├── controllers/ # Business logic
│   │   ├── sockets/     # Socket.io events
│   │   └── config/      # Configuration files
│   └── package.json
└── README.md
```

## Prerequisites

Before you begin, ensure you have installed:
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

## Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Joker
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Set Up Environment Variables

#### Backend (.env)
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key_here_change_this
NODE_ENV=development
```

#### Frontend (.env)
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Running Locally

### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:5000

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:5173

Visit http://localhost:5173 in your browser to play!

## Admin Access

To access the admin panel:
1. Navigate to http://localhost:5173/admin
2. Login with:
   - Username: `Neo`
   - Password: `Angill963`

From the admin panel, you can add chips to any user account.

## Game Rules

- **Buy-in**: Default 500 chips
- **Blinds**: Small blind (5 chips) / Big blind (10 chips)
- **Max Players**: 8 per table
- **Game Type**: Texas Hold'em No-Limit

## Deployment

### Option 1: Vercel (Frontend) + Render/Railway (Backend)

#### Deploy Backend to Render:
1. Create account at render.com
2. Connect your GitHub repository
3. Create new "Web Service"
4. Set environment variables
5. Deploy

#### Deploy Frontend to Vercel:
1. Install Vercel CLI: `npm i -g vercel`
2. From frontend directory: `vercel`
3. Follow prompts
4. Update `.env` with production backend URL

### Option 2: Heroku (Full Stack)

```bash
# Deploy backend
cd backend
heroku create your-poker-backend
git push heroku main

# Deploy frontend
cd ../frontend
heroku create your-poker-frontend
git push heroku main
```

### Option 3: VPS (DigitalOcean, AWS, etc.)

See `DEPLOYMENT.md` for detailed VPS setup instructions.

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended for Hosting)
1. Create free account at mongodb.com/cloud/atlas
2. Create a cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all)
5. Get connection string
6. Update `MONGO_URI` in backend `.env`

### Option 2: Local MongoDB
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Use connection string
MONGO_URI=mongodb://localhost:27017/joker-poker
```

## Playing with Friends Online

To play with friends, you need to:

1. **Deploy the application** (see Deployment section)
2. **Share the URL** with your friends
3. **Create a room** - One player creates a room and gets a room code
4. **Join room** - Other players use the room code to join
5. **Play!** - Minimum 2 players to start a game

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running
- Check firewall settings
- Verify environment variables
- Check backend is running before starting frontend

### Socket.io Not Connecting
- Verify CORS settings in backend
- Check WebSocket port isn't blocked
- Ensure backend URL is correct in frontend .env

### Game Not Starting
- Minimum 2 players required
- Check browser console for errors
- Verify Socket.io connection in Network tab

## Development

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Acknowledgments

- Design inspiration from landonorris.com and liquidtechnology.net
- Dashboard design from CodePen (responsive-dashboardlight-dark-ui)
- Navigation design from speed-run-nav
- Poker hand evaluation logic

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Disclaimer

This is a play-money poker game for entertainment purposes only. No real money gambling is involved.

**Age Restriction**: 18+ only
**© 2026 Joker. All rights reserved. Not for real gambling.**
