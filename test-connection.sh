#!/bin/bash

# Test Vercel + Render Connection
# Run this to verify your deployment is working

echo "🔍 Testing ContentGenie Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="https://contentgenei.onrender.com"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Testing Backend Health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
    curl -s "$BACKEND_URL/api/health" | python3 -m json.tool
else
    echo -e "${RED}❌ Backend health check failed (HTTP $response)${NC}"
    echo "   This might be a cold start. Waiting 30 seconds..."
    sleep 30
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Backend is now healthy!${NC}"
    else
        echo -e "${RED}❌ Backend still not responding${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testing CORS Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test OPTIONS request (preflight)
cors_response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: https://your-app.vercel.app" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    "$BACKEND_URL/api/auth/verify-token")

if [ "$cors_response" = "200" ] || [ "$cors_response" = "204" ]; then
    echo -e "${GREEN}✅ CORS is configured correctly!${NC}"
else
    echo -e "${YELLOW}⚠️  CORS might need configuration (HTTP $cors_response)${NC}"
    echo "   Add your Vercel URL to CORS_ORIGINS in Render"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Testing API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test auth endpoint (should return 401 without token)
auth_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/verify-token")

if [ "$auth_response" = "401" ]; then
    echo -e "${GREEN}✅ Auth endpoint is working (401 expected)${NC}"
elif [ "$auth_response" = "500" ]; then
    echo -e "${RED}❌ Auth endpoint error (500)${NC}"
    echo "   Check Render logs for database connection issues"
else
    echo -e "${YELLOW}⚠️  Auth endpoint returned HTTP $auth_response${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Testing Database Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Try to access an endpoint that requires DB
db_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/profile")

if [ "$db_response" = "401" ]; then
    echo -e "${GREEN}✅ Database connection is working (401 expected)${NC}"
elif [ "$db_response" = "500" ]; then
    echo -e "${RED}❌ Database connection error (500)${NC}"
    echo "   Check DATABASE_URL and MONGODB_URI in Render"
else
    echo -e "${YELLOW}⚠️  Profile endpoint returned HTTP $db_response${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Open your Vercel app in browser"
echo "2. Open DevTools (F12) → Network tab"
echo "3. Try to register/login"
echo "4. Check if API calls go to: $BACKEND_URL"
echo ""
echo "If you see CORS errors:"
echo "→ Add your Vercel URL to CORS_ORIGINS in Render environment variables"
echo ""
echo "If backend is slow (30-60s):"
echo "→ This is normal for Render free tier (cold start)"
echo "→ Upgrade to paid tier ($7/month) for always-on"
echo ""
echo "Check logs:"
echo "→ Render: https://dashboard.render.com → Your Service → Logs"
echo "→ Vercel: https://vercel.com → Your Project → Deployments"
echo ""
