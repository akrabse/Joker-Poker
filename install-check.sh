#!/bin/bash

# Joker Poker - Installation & Verification Script
# This script checks if everything is set up correctly

echo "╔════════════════════════════════════════╗"
echo "║   🃏 Joker Poker Installation Check   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 directory exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 directory is missing"
        return 1
    fi
}

# Step 1: Check prerequisites
echo "📦 Checking Prerequisites..."
check_command node
check_command npm
echo ""

# Step 2: Check project structure
echo "📁 Checking Project Structure..."
check_dir "backend"
check_dir "backend/src"
check_dir "frontend"
check_dir "frontend/src"
echo ""

# Step 3: Check backend files
echo "🔧 Checking Backend Files..."
check_file "backend/package.json"
check_file "backend/src/server.js"
check_file "backend/src/app.js"
check_file "backend/.env"
echo ""

# Step 4: Check frontend files
echo "🎨 Checking Frontend Files..."
check_file "frontend/package.json"
check_file "frontend/index.html"
check_file "frontend/src/main.jsx"
check_file "frontend/src/App.jsx"
check_file "frontend/.env"
echo ""

# Step 5: Check dependencies
echo "📚 Checking Dependencies..."
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Backend dependencies NOT installed"
    echo "  Run: cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Frontend dependencies NOT installed"
    echo "  Run: cd frontend && npm install"
fi
echo ""

# Step 6: Check environment variables
echo "🔐 Checking Environment Configuration..."
if grep -q "MONGO_URI" backend/.env; then
    if grep -q "mongodb://localhost:27017" backend/.env; then
        echo -e "${YELLOW}⚠${NC} Using local MongoDB - Make sure it's running"
    elif grep -q "mongodb+srv://" backend/.env; then
        echo -e "${GREEN}✓${NC} Using MongoDB Atlas"
    else
        echo -e "${RED}✗${NC} MONGO_URI configured but format unclear"
    fi
else
    echo -e "${RED}✗${NC} MONGO_URI not configured in backend/.env"
fi

if grep -q "JWT_SECRET" backend/.env; then
    echo -e "${GREEN}✓${NC} JWT_SECRET configured"
else
    echo -e "${RED}✗${NC} JWT_SECRET not configured in backend/.env"
fi
echo ""

# Step 7: Port check
echo "🔌 Checking Ports..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠${NC} Port 5000 is already in use"
    echo "  Backend may already be running or port is occupied"
else
    echo -e "${GREEN}✓${NC} Port 5000 is available"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠${NC} Port 5173 is already in use"
    echo "  Frontend may already be running or port is occupied"
else
    echo -e "${GREEN}✓${NC} Port 5173 is available"
fi
echo ""

# Final summary
echo "════════════════════════════════════════"
echo "📋 Summary"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. If dependencies not installed:"
echo "   cd backend && npm install"
echo "   cd frontend && npm install"
echo ""
echo "2. Start the application:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "3. Visit: http://localhost:5173"
echo ""
echo "For full guide, see: QUICK_START.md"
echo ""
echo "🃏 Happy playing!"
