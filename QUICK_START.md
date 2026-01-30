# 🃏 Joker Poker - Quick Start Guide

## ⚡ FASTEST WAY TO GET STARTED (5 Minutes)

### Step 1: Extract Files
```bash
unzip Joker-Poker.zip
cd Joker
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend  
npm install
```

### Step 3: Set Up MongoDB

**Easiest Option - MongoDB Atlas (Free):**
1. Go to https://mongodb.com/cloud/atlas
2. Sign up (free)
3. Create a free cluster (takes 3 minutes)
4. Get your connection string
5. Whitelist all IPs (0.0.0.0/0)

### Step 4: Configure Environment

**Backend `.env` file:**
```bash
cd backend
cat > .env << EOF
PORT=5000
MONGO_URI=mongodb+srv://your-user:your-password@cluster.mongodb.net/joker-poker
JWT_SECRET=change_this_to_a_random_secret_key_123456789
NODE_ENV=development
ADMIN_USERNAME=Neo
EOF
```

**Frontend `.env` file:**
```bash
cd ../frontend
cat > .env << EOF
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
EOF
```

### Step 5: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 6: Play!

1. Open http://localhost:5173
2. Create an account or continue as guest
3. Create a room → Share code with friends
4. Have fun! 🎉

---

## 🌐 DEPLOY ONLINE (Play with Friends Anywhere)

### Quick Deploy (20 Minutes)

**1. MongoDB Atlas Setup:**
- Already done from above! ✓
- Just use the same connection string

**2. Deploy Backend to Render.com:**
```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git remote add origin your-github-repo-url
git push -u origin main

# Then go to render.com:
# 1. Sign up with GitHub
# 2. New Web Service → Select repo
# 3. Root: backend/
# 4. Build: npm install  
# 5. Start: npm start
# 6. Add env vars (MONGO_URI, JWT_SECRET, etc.)
# 7. Deploy!
```

**3. Deploy Frontend to Vercel:**
```bash
cd frontend
npm i -g vercel
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? joker-poker
# - Directory? ./
# - Build command? npm run build
# - Output dir? dist

# Add environment variables in Vercel dashboard:
# VITE_API_URL = https://your-backend.onrender.com
# VITE_SOCKET_URL = https://your-backend.onrender.com
```

**4. Update Backend CORS:**

Edit `backend/src/app.js` and `backend/src/server.js`:
```javascript
origin: ['https://your-app.vercel.app']
```

Push changes:
```bash
git add .
git commit -m "Update CORS"
git push
```

**5. Share with Friends:**
- Send them: `https://your-app.vercel.app`
- Create room → Share 6-digit code
- Play together! 🎮

---

## 📝 COMMON ISSUES & FIXES

### "Cannot connect to MongoDB"
**Fix:** Check connection string has correct password and `/joker-poker` database name

### "CORS Error"
**Fix:** Add your frontend URL to backend CORS settings

### "Socket.io not connecting"
**Fix:** Ensure backend is running and SOCKET_URL is correct

### "Game won't start"
**Fix:** Need minimum 2 players AND all must buy-in first

---

## 🎮 HOW TO PLAY

1. **Login/Register** or continue as guest
2. **Create Room** → Get 6-digit code (e.g., "ABC123")
3. **Share code** with friends
4. **Buy chips** (default 500 chips = €2 value)
5. **Wait for 2+ players** to join
6. **Start hand** and play Texas Hold'em!

### Admin Panel (Add Chips):
- Go to `/admin`
- Login: Username `Neo`, Password `Angill963`  
- Add chips to any player

---

## 📚 NEED MORE HELP?

See full guides:
- `README.md` - Complete documentation
- `DEPLOYMENT.md` - Detailed deployment guide
- Backend docs: `backend/README.md`

---

## ✅ VERIFICATION CHECKLIST

Before playing with friends:

- [ ] MongoDB connected (see "✅ MongoDB Connected" in backend logs)
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can create account and login
- [ ] Can create room and get code
- [ ] Admin panel works (/admin)

If all checked, you're ready to play! 🎉

---

## 🚀 PRODUCTION CHECKLIST

Before going live:

- [ ] Changed JWT_SECRET to random 64+ char string
- [ ] MongoDB IP whitelist set to 0.0.0.0/0
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and can access backend
- [ ] CORS updated with production URLs
- [ ] Tested with at least 2 players
- [ ] Admin panel accessible

---

**Need help? Check the full README.md or open an issue!**

**Have fun playing Joker Poker! 🃏♠️♥️♦️♣️**
