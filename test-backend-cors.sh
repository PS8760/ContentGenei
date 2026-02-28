#!/bin/bash

echo "🧪 Testing Backend CORS Configuration"
echo "======================================"
echo ""

# Test 1: Health endpoint
echo "1. Testing health endpoint..."
HEALTH=$(curl -s http://localhost:5001/api/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is not responding"
    echo "   Run: ./start-backend.sh"
    exit 1
fi

echo ""

# Test 2: LinkoGenei test endpoint
echo "2. Testing LinkoGenei API..."
LINKOGENEI=$(curl -s http://localhost:5001/api/linkogenei/test)
if echo "$LINKOGENEI" | grep -q "success"; then
    echo "   ✅ LinkoGenei API is working"
else
    echo "   ❌ LinkoGenei API is not responding"
    exit 1
fi

echo ""

# Test 3: CORS headers
echo "3. Testing CORS headers..."
CORS=$(curl -s -I -X OPTIONS http://localhost:5001/api/linkogenei/test \
    -H "Origin: chrome-extension://test" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type, Authorization")

if echo "$CORS" | grep -q "Access-Control-Allow-Origin"; then
    echo "   ✅ CORS headers are present"
else
    echo "   ⚠️  CORS headers might not be configured for extensions"
fi

echo ""

# Test 4: Save post endpoint (without auth)
echo "4. Testing save-post endpoint..."
SAVE=$(curl -s -X POST http://localhost:5001/api/linkogenei/save-post \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test-token" \
    -d '{"url":"https://test.com","platform":"Test"}')

if echo "$SAVE" | grep -q "error"; then
    echo "   ✅ Endpoint is responding (auth required)"
else
    echo "   ⚠️  Unexpected response"
fi

echo ""
echo "======================================"
echo "📋 Summary"
echo ""
echo "If all tests pass, the backend is ready for the extension."
echo ""
echo "Next steps:"
echo "1. Reload the extension in Chrome"
echo "2. Generate a token from the dashboard"
echo "3. Activate the extension with the token"
echo "4. Try saving a post from Instagram/LinkedIn/Twitter"
echo ""
echo "If 'Failed to fetch' error persists:"
echo "1. Restart the backend: ./start-backend.sh"
echo "2. Reload the extension in Chrome"
echo "3. Check browser console for detailed errors (F12)"
