#!/bin/bash

# Instagram OAuth Setup Test Script
# This script checks if everything is configured correctly

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Instagram OAuth Configuration Test                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Backend Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 5001${NC}"
    curl -s http://localhost:5001/api/health | python3 -m json.tool 2>/dev/null || echo "Response received"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start with: cd backend && python run.py"
    exit 1
fi
echo ""

# Test 2: Instagram Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Instagram Configuration (NO AUTH REQUIRED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONFIG=$(curl -s http://localhost:5001/api/instagram/debug)

if echo "$CONFIG" | grep -q '"success": true'; then
    echo -e "${GREEN}✅ Instagram config endpoint accessible${NC}"
    echo ""
    
    # Check each config value
    if echo "$CONFIG" | grep -q '"app_id": "loaded"'; then
        echo -e "${GREEN}✅ INSTAGRAM_APP_ID: loaded${NC}"
    else
        echo -e "${RED}❌ INSTAGRAM_APP_ID: missing${NC}"
    fi
    
    if echo "$CONFIG" | grep -q '"app_secret": "loaded"'; then
        echo -e "${GREEN}✅ INSTAGRAM_APP_SECRET: loaded${NC}"
    else
        echo -e "${RED}❌ INSTAGRAM_APP_SECRET: missing${NC}"
    fi
    
    REDIRECT_URI=$(echo "$CONFIG" | grep -o '"redirect_uri": "[^"]*"' | cut -d'"' -f4)
    if [ -n "$REDIRECT_URI" ] && [ "$REDIRECT_URI" != "missing" ]; then
        echo -e "${GREEN}✅ INSTAGRAM_REDIRECT_URI: $REDIRECT_URI${NC}"
    else
        echo -e "${RED}❌ INSTAGRAM_REDIRECT_URI: missing${NC}"
    fi
    
    SCOPES=$(echo "$CONFIG" | grep -o '"scopes": "[^"]*"' | cut -d'"' -f4)
    if [ -n "$SCOPES" ]; then
        echo -e "${GREEN}✅ INSTAGRAM_SCOPES: $SCOPES${NC}"
    else
        echo -e "${YELLOW}⚠️  INSTAGRAM_SCOPES: using defaults${NC}"
    fi
    
else
    echo -e "${RED}❌ Failed to get Instagram config${NC}"
    echo "$CONFIG"
fi
echo ""

# Test 3: ngrok Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: ngrok Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if pgrep -x "ngrok" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ngrok is running${NC}"
    
    # Try to get ngrok URL from API
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
    if [ -n "$NGROK_URL" ]; then
        echo "   URL: $NGROK_URL"
        
        # Check if it matches .env
        if [ -n "$REDIRECT_URI" ] && echo "$REDIRECT_URI" | grep -q "$NGROK_URL"; then
            echo -e "${GREEN}   ✅ Matches INSTAGRAM_REDIRECT_URI${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Does NOT match INSTAGRAM_REDIRECT_URI${NC}"
            echo "   Update backend/.env with: $NGROK_URL/api/instagram/callback"
        fi
    fi
else
    echo -e "${RED}❌ ngrok is NOT running${NC}"
    echo "   Start with: ngrok http 5001"
fi
echo ""

# Test 4: Frontend Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Frontend Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 5173${NC}"
else
    echo -e "${RED}❌ Frontend is NOT running${NC}"
    echo "   Start with: cd frontend && npm run dev"
fi
echo ""

# Test 5: CORS Test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: CORS Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CORS_TEST=$(curl -s -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,ngrok-skip-browser-warning" \
  -X OPTIONS \
  http://localhost:5001/api/instagram/debug \
  -i 2>&1 | grep -i "access-control")

if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS is configured correctly${NC}"
else
    echo -e "${YELLOW}⚠️  CORS might have issues${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Make sure all tests pass (all ✅)"
echo "2. Open http://localhost:5173/instagram-analytics"
echo "3. Login to ContentGenie"
echo "4. Click 'Connect Instagram'"
echo ""
echo "Debug endpoint (no auth required):"
echo "  curl http://localhost:5001/api/instagram/debug"
echo ""
echo "Full debug guide: INSTAGRAM_DEBUG_GUIDE.md"
echo ""
