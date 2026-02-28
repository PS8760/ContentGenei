// Background service worker for LinkoGenei

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkoGenei extension installed');
  
  // Set default values
  chrome.storage.local.set({
    linkoGeneiActive: false,
    linkoGeneiToken: null
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'savePost') {
    // Handle post saving
    handleSavePost(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Handle post saving
async function handleSavePost(postData) {
  const result = await chrome.storage.local.get(['linkoGeneiToken']);
  const token = result.linkoGeneiToken;

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('http://localhost:5001/api/linkogenei/save-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(postData)
  });

  if (!response.ok) {
    throw new Error('Failed to save post');
  }

  return await response.json();
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
