#!/bin/bash

echo "🔧 Fixing LinkoGenei Extension Connection"
echo "=========================================="
echo ""

# Check if backend is running
echo "1. Checking backend status..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 5001"
else
    echo "   ❌ Backend is NOT running"
    echo "   Starting backend..."
    ./start-backend.sh &
    sleep 3
fi

echo ""

# Test LinkoGenei endpoint
echo "2. Testing LinkoGenei API..."
RESPONSE=$(curl -s http://localhost:5001/api/linkogenei/test)
if echo "$RESPONSE" | grep -q "success"; then
    echo "   ✅ LinkoGenei API is working"
else
    echo "   ❌ LinkoGenei API is not responding"
    echo "   Response: $RESPONSE"
fi

echo ""

# Test CORS with extension origin
echo "3. Testing CORS for Chrome extensions..."
CORS=$(curl -s -X OPTIONS http://localhost:5001/api/linkogenei/save-post \
    -H "Origin: chrome-extension://test123" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type, Authorization" \
    -i 2>&1 | grep -i "access-control")

if [ -n "$CORS" ]; then
    echo "   ✅ CORS is configured"
    echo "   Headers: $CORS"
else
    echo "   ⚠️  CORS headers not found"
fi

echo ""
echo "=========================================="
echo "📋 Next Steps:"
echo ""
echo "1. Reload the Chrome extension:"
echo "   - Go to chrome://extensions/"
echo "   - Find LinkoGenei extension"
echo "   - Click the reload icon (🔄)"
echo ""
echo "2. Clear browser cache (optional but recommended):"
echo "   - Press Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)"
echo "   - Select 'Cached images and files'"
echo "   - Click 'Clear data'"
echo ""
echo "3. Reactivate the extension:"
echo "   - Click extension icon"
echo "   - Make sure token is pasted"
echo "   - Click 'Activate Extension'"
echo ""
echo "4. Test on Instagram:"
echo "   - Visit https://www.instagram.com"
echo "   - Refresh the page (F5)"
echo "   - Look for 'Save to Genei' buttons"
echo "   - Click a button to test"
echo ""
echo "If still not working:"
echo "   - Check browser console (F12) for errors"
echo "   - Try restarting Chrome completely"
echo "   - Make sure you're using http://localhost:5001 (not https)"
