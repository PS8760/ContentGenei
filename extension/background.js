// Background service worker for LinkoGenei

// Backend URLs
const BACKEND_URLS = {
  aws: 'http://3.235.236.139/api',
  render: 'https://contentgenei.onrender.com/api'
};

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkoGenei extension installed');
  
  // Set default values
  chrome.storage.local.set({
    linkoGeneiActive: false,
    linkoGeneiToken: null,
    selectedBackend: 'aws'
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'savePost') {
    // Handle post saving - bypass CSP by making request from background
    handleSavePost(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Handle post saving
async function handleSavePost(postData) {
  console.log('Background: Saving post...', postData);
  
  const result = await chrome.storage.local.get(['linkoGeneiToken', 'selectedBackend']);
  const token = result.linkoGeneiToken;
  const backend = result.selectedBackend || 'aws';
  const apiUrl = BACKEND_URLS[backend];

  if (!token) {
    throw new Error('No authentication token found');
  }

  console.log('Background: Using backend:', backend, 'URL:', apiUrl);

  const response = await fetch(`${apiUrl}/linkogenei/save-post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(postData)
  });

  console.log('Background: Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Background: Error response:', errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('Background: Success!', data);
  return data;
}

// Badge management
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.linkoGeneiActive) {
    if (changes.linkoGeneiActive.newValue) {
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});
