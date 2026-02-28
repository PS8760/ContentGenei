// DEBUG VERSION - Content script with extensive logging

console.log('🔗 LinkoGenei DEBUG: Content script loaded');

const API_URL = 'http://localhost:5001/api';
console.log('🔗 LinkoGenei DEBUG: API_URL =', API_URL);

let isActive = false;
let authToken = null;

// Test API connection immediately
async function testConnection() {
    console.log('🔗 LinkoGenei DEBUG: Testing API connection...');
    
    try {
        const response = await fetch(`${API_URL}/linkogenei/test`);
        console.log('🔗 LinkoGenei DEBUG: Response status:', response.status);
        
        const data = await response.json();
        console.log('🔗 LinkoGenei DEBUG: Response data:', data);
        
        if (data.success) {
            console.log('✅ LinkoGenei DEBUG: API connection successful!');
            return true;
        } else {
            console.error('❌ LinkoGenei DEBUG: API returned error:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ LinkoGenei DEBUG: Connection failed:', error);
        console.error('❌ LinkoGenei DEBUG: Error details:', {
            message: error.message,
            stack: error.stack
        });
        return false;
    }
}

// Test connection on load
testConnection();

// Initialize extension
async function init() {
    console.log('🔗 LinkoGenei DEBUG: Initializing...');
    
    const result = await chrome.storage.local.get(['linkoGeneiActive', 'linkoGeneiToken']);
    console.log('🔗 LinkoGenei DEBUG: Storage result:', result);
    
    isActive = result.linkoGeneiActive || false;
    authToken = result.linkoGeneiToken || null;
    
    console.log('🔗 LinkoGenei DEBUG: isActive =', isActive);
    console.log('🔗 LinkoGenei DEBUG: authToken =', authToken ? authToken.substring(0, 10) + '...' : 'null');

    if (isActive && authToken) {
        console.log('✅ LinkoGenei DEBUG: Extension is active, starting observer');
        startObserving();
    } else {
        console.log('⚠️ LinkoGenei DEBUG: Extension is not active');
    }
}

// Detect platform
function detectPlatform() {
    const hostname = window.location.hostname;
    console.log('🔗 LinkoGenei DEBUG: Detecting platform for:', hostname);
    
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('twitter.com')) return 'twitter';
    if (hostname.includes('x.com')) return 'x';
    
    console.log('⚠️ LinkoGenei DEBUG: Platform not supported');
    return null;
}

// Start observing
function startObserving() {
    const platform = detectPlatform();
    console.log('🔗 LinkoGenei DEBUG: Platform detected:', platform);
    
    if (!platform) {
        console.log('⚠️ LinkoGenei DEBUG: Not on a supported platform, exiting');
        return;
    }

    console.log('✅ LinkoGenei DEBUG: Starting to observe for posts');
    
    // Add a test button to the page
    addTestButton();
}

// Add a test button
function addTestButton() {
    console.log('🔗 LinkoGenei DEBUG: Adding test button');
    
    const button = document.createElement('button');
    button.textContent = '🧪 Test LinkoGenei Connection';
    button.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 999999;
        padding: 12px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    button.addEventListener('click', async () => {
        console.log('🔗 LinkoGenei DEBUG: Test button clicked');
        button.textContent = '🧪 Testing...';
        
        const success = await testSavePost();
        
        if (success) {
            button.textContent = '✅ Connection Works!';
            button.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
        } else {
            button.textContent = '❌ Connection Failed';
            button.style.background = 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
        }
        
        setTimeout(() => {
            button.textContent = '🧪 Test LinkoGenei Connection';
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }, 3000);
    });
    
    document.body.appendChild(button);
    console.log('✅ LinkoGenei DEBUG: Test button added to page');
}

// Test save post
async function testSavePost() {
    console.log('🔗 LinkoGenei DEBUG: Testing save post...');
    console.log('🔗 LinkoGenei DEBUG: Token:', authToken ? authToken.substring(0, 10) + '...' : 'null');
    
    if (!authToken) {
        console.error('❌ LinkoGenei DEBUG: No token available');
        alert('No token! Please activate the extension first.');
        return false;
    }
    
    try {
        console.log('🔗 LinkoGenei DEBUG: Sending POST request to:', `${API_URL}/linkogenei/save-post`);
        
        const response = await fetch(`${API_URL}/linkogenei/save-post`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                url: window.location.href,
                platform: detectPlatform() || 'Test',
                title: document.title,
                saved_at: new Date().toISOString()
            })
        });
        
        console.log('🔗 LinkoGenei DEBUG: Response status:', response.status);
        console.log('🔗 LinkoGenei DEBUG: Response headers:', [...response.headers.entries()]);
        
        const data = await response.json();
        console.log('🔗 LinkoGenei DEBUG: Response data:', data);
        
        if (response.ok && data.success) {
            console.log('✅ LinkoGenei DEBUG: Post saved successfully!');
            alert('✅ Success! Post saved. Check console for details.');
            return true;
        } else {
            console.error('❌ LinkoGenei DEBUG: Save failed:', data);
            alert(`❌ Failed: ${data.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.error('❌ LinkoGenei DEBUG: Exception:', error);
        console.error('❌ LinkoGenei DEBUG: Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        alert(`❌ Error: ${error.message}\n\nCheck console for details.`);
        return false;
    }
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🔗 LinkoGenei DEBUG: Message received:', message);
    
    if (message.action === 'activate') {
        isActive = true;
        authToken = message.token;
        console.log('✅ LinkoGenei DEBUG: Extension activated');
        startObserving();
    } else if (message.action === 'deactivate') {
        isActive = false;
        authToken = null;
        console.log('⚠️ LinkoGenei DEBUG: Extension deactivated');
    }
});

// Initialize
console.log('🔗 LinkoGenei DEBUG: Calling init()');
init();

console.log('🔗 LinkoGenei DEBUG: Content script setup complete');
