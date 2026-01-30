# Joker Poker - Complete Deployment Guide

This guide will walk you through deploying your Joker Poker application online so you can play with friends.

## Prerequisites

Before starting, make sure you have:
- Node.js (v18+) installed
- A GitHub account
- A MongoDB Atlas account (free tier is fine)
- Accounts on hosting platforms (Vercel/Render or similar)

## Part 1: Local Setup and Testing

### 1. Extract the ZIP file
```bash
unzip Joker-Poker.zip
cd Joker
```

### 2. Set up Backend

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_very_secret_jwt_key_change_this
NODE_ENV=development
ADMIN_USERNAME=Neo
```

### 3. Set up Frontend

```bash
cd ../frontend
npm install
```

Create `.env` file in `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Test Locally

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Part 2: MongoDB Setup (Database)

### Option A: MongoDB Atlas (Recommended - Free & Easy)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Click "Build a Database" → Choose "Free" tier (M0)
4. Select a cloud provider and region (closest to you)
5. Name your cluster (e.g., "joker-poker")
6. Click "Create"

**Get Connection String:**
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
4. Replace `<password>` with your database password
5. Add database name: `mongodb+srv://username:password@cluster.mongodb.net/joker-poker`

**Whitelist IP Addresses:**
1. Go to "Network Access" in sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### Option B: Local MongoDB (Development Only)

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Use connection string
MONGO_URI=mongodb://localhost:27017/joker-poker
```

---

## Part 3: Deploying Backend

### Option A: Render.com (Recommended - Free Tier)

1. Push your code to GitHub
2. Go to https://render.com
3. Sign up and connect your GitHub account
4. Click "New +" → "Web Service"
5. Select your repository
6. Configure:
   - **Name:** `joker-poker-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

7. Add Environment Variables:
   - `MONGO_URI` = (your MongoDB Atlas connection string)
   - `JWT_SECRET` = (random secret key)
   - `NODE_ENV` = `production`
   - `ADMIN_USERNAME` = `Neo`
   - `PORT` = `5000`

8. Click "Create Web Service"
9. Wait for deployment (5-10 minutes)
10. Copy your backend URL (e.g., `https://joker-poker-backend.onrender.com`)

### Option B: Railway.app

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select repository → Choose `backend` folder as root
5. Add environment variables (same as above)
6. Deploy

### Option C: Heroku

```bash
cd backend
heroku create joker-poker-backend
heroku config:set MONGO_URI="your_connection_string"
heroku config:set JWT_SECRET="your_secret"
heroku config:set NODE_ENV="production"
git push heroku main
```

---

## Part 4: Deploying Frontend

### Option A: Vercel (Recommended - Free & Fast)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your repository
5. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

6. Add Environment Variables:
   - `VITE_API_URL` = `https://your-backend-url.onrender.com`
   - `VITE_SOCKET_URL` = `https://your-backend-url.onrender.com`

7. Click "Deploy"
8. Wait for deployment (2-3 minutes)
9. Copy your frontend URL (e.g., `https://joker-poker.vercel.app`)

### Option B: Netlify

1. Go to https://netlify.com
2. Connect GitHub repository
3. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
4. Add environment variables
5. Deploy

---

## Part 5: Update Backend CORS

After deploying frontend, update your backend's CORS settings:

In `backend/src/app.js`, change:
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-app.vercel.app']  // ← Add your frontend URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
```

In `backend/src/server.js`, update Socket.io CORS:
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://your-vercel-app.vercel.app']  // ← Add your frontend URL
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

Commit and push changes to trigger redeployment.

---

## Part 6: Playing with Friends

### How to Invite Friends:

1. Share your frontend URL: `https://your-app.vercel.app`
2. One person creates a room → Gets a 6-digit code (e.g., "ABC123")
3. Share the room code with friends
4. Friends enter the code to join
5. Start playing!

### Important Notes:

- **Minimum 2 players** required to start
- **Maximum 8 players** per table
- Everyone needs to buy-in before playing
- Default starting chips: 500 (you can add more via admin panel)

---

## Part 7: Admin Panel Usage

### Access Admin Panel:

1. Go to `https://your-app.vercel.app/admin`
2. Login with:
   - Username: `Neo`
   - Password: `Angill963`

### Add Chips to Users:

1. Enter the player's username
2. Enter chip amount
3. Click "Add Chips"
4. Player will see updated balance immediately

---

## Troubleshooting

### Issue: "Connection failed"
**Solution:** Check that backend is running and URLs in frontend `.env` are correct

### Issue: "Socket not connecting"
**Solution:** Ensure backend CORS includes your frontend URL

### Issue: "MongoDB connection error"
**Solution:** 
- Check MongoDB Atlas connection string is correct
- Verify IP whitelist includes 0.0.0.0/0
- Ensure database user has read/write permissions

### Issue: "Players can't join room"
**Solution:**
- Verify Socket.io is running on backend
- Check Network tab in browser for WebSocket connections
- Ensure room code is exactly 6 characters

### Issue: "Game not starting"
**Solution:**
- Minimum 2 players required
- All players must buy-in first
- Check browser console for errors

---

## Monitoring Your App

### Backend Health Check:
Visit: `https://your-backend.onrender.com/health`

Should return: `{"status":"OK",...}`

### Check MongoDB Connection:
Look at backend logs for: `✅ MongoDB Connected`

### View Active Games:
API endpoint: `https://your-backend.onrender.com/api/games` (requires auth token)

---

## Cost Estimates

### Free Tier (Recommended for Testing):
- MongoDB Atlas: Free (512MB storage)
- Render.com Backend: Free (spins down after 15min inactivity)
- Vercel Frontend: Free (100GB bandwidth)

**Total: $0/month**

### Paid Tier (For Active Use):
- MongoDB Atlas: $0/month (Atlas free tier)
- Render.com Backend: $7/month (always on)
- Vercel Frontend: Free or $20/month (Pro)

**Total: $7-27/month**

---

## Updating Your App

### After making changes:

1. Commit changes to GitHub:
```bash
git add .
git commit -m "Update game logic"
git push
```

2. Deployments auto-trigger:
   - Render/Railway: Automatically rebuilds
   - Vercel: Automatically rebuilds

---

## Security Best Practices

1. **Change admin password** in production
2. **Use strong JWT_SECRET** (random 64+ character string)
3. **Enable MongoDB user authentication**
4. **Don't commit .env files** to GitHub
5. **Regularly update dependencies**: `npm update`

---

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check backend logs on Render/Railway dashboard
3. Verify environment variables are set correctly
4. Ensure MongoDB is connected

Common error patterns:
- `401 Unauthorized` → Check JWT token
- `500 Server Error` → Check backend logs
- `CORS Error` → Update CORS settings
- `Socket disconnect` → Check WebSocket connection

---

## Next Steps

Once deployed:

1. Test with a friend to ensure everything works
2. Monitor MongoDB usage (stay under free tier limits)
3. Consider upgrading to paid tier for better performance
4. Add more features (leaderboards, achievements, etc.)

**Your app is now live and ready to play! 🃏🎉**

Share the URL with friends and enjoy multiplayer poker!
