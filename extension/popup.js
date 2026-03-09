// Popup script for LinkoGenei extension

// Backend URLs - Multiple deployment options
const BACKEND_URLS = {
  aws: 'http://3.235.236.139/api',
  render: 'https://contentgenei.onrender.com/api'
};

// Dashboard URLs
const DASHBOARD_URLS = {
  aws: 'http://3.235.236.139/linkogenei',
  render: 'https://contentgenei.onrender.com/linkogenei'
};

// Default backend (can be changed by user)
let API_URL = BACKEND_URLS.aws;
let DASHBOARD_URL = DASHBOARD_URLS.aws;

// Load saved backend preference
chrome.storage.local.get(['selectedBackend'], (result) => {
  const backend = result.selectedBackend || 'aws';
  API_URL = BACKEND_URLS[backend];
  DASHBOARD_URL = DASHBOARD_URLS[backend];
  
  // Set dropdown value after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const select = document.getElementById('backendSelect');
      if (select) select.value = backend;
    });
  }
});

// DOM Elements
const backendSelect = document.getElementById('backendSelect');
const loginSection = document.getElementById('loginSection');
const activeSection = document.getElementById('activeSection');
const tokenInput = document.getElementById('tokenInput');
const activateBtn = document.getElementById('activateBtn');
const deactivateBtn = document.getElementById('deactivateBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const getTokenLink = document.getElementById('getTokenLink');
const messageEl = document.getElementById('message');
const savedCountEl = document.getElementById('savedCount');
const categoryCountEl = document.getElementById('categoryCount');

// Backend selector change handler
backendSelect.addEventListener('change', (e) => {
  const selectedBackend = e.target.value;
  
  // Save preference
  chrome.storage.local.set({ selectedBackend }, () => {
    // Update URLs
    API_URL = BACKEND_URLS[selectedBackend];
    DASHBOARD_URL = DASHBOARD_URLS[selectedBackend];
    
    showMessage(`Switched to ${selectedBackend.toUpperCase()} backend`, 'success');
    
    // Notify content scripts to update their API_URL
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateBackend',
          backend: selectedBackend 
        }).catch(() => {});
      });
    });
    
    // Reload stats if active
    chrome.storage.local.get(['linkoGeneiActive'], (result) => {
      if (result.linkoGeneiActive) {
        loadStats();
      }
    });
  });
});

// Check if extension is already activated
chrome.storage.local.get(['linkoGeneiToken', 'linkoGeneiActive', 'selectedBackend'], (result) => {
  // Set backend selector value
  if (result.selectedBackend) {
    backendSelect.value = result.selectedBackend;
  }
  
  if (result.linkoGeneiActive && result.linkoGeneiToken) {
    showActiveSection();
    loadStats();
  } else {
    showLoginSection();
  }
});

// Activate extension
activateBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  
  if (!token) {
    showMessage('Please enter a valid token', 'error');
    return;
  }

  // Verify token with backend
  try {
    const response = await fetch(`${API_URL}/linkogenei/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Save token and activate
      chrome.storage.local.set({
        linkoGeneiToken: token,
        linkoGeneiActive: true,
        userId: data.user_id
      }, () => {
        showMessage('Extension activated successfully!', 'success');
        setTimeout(() => {
          showActiveSection();
          loadStats();
        }, 1000);
      });

      // Notify content scripts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'activate',
            token: token 
          }).catch(() => {});
        });
      });
    } else {
      showMessage(data.error || 'Invalid token. Please try again.', 'error');
    }
  } catch (error) {
    showMessage('Failed to connect to server. Please try again.', 'error');
    console.error('Activation error:', error);
  }
});

// Deactivate extension
deactivateBtn.addEventListener('click', () => {
  chrome.storage.local.set({
    linkoGeneiActive: false
  }, () => {
    showMessage('Extension deactivated', 'success');
    setTimeout(() => {
      showLoginSection();
      tokenInput.value = '';
    }, 1000);

    // Notify content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'deactivate' 
        }).catch(() => {});
      });
    });
  });
});

// Open dashboard
openDashboardBtn.addEventListener('click', () => {
  chrome.storage.local.get(['selectedBackend'], (result) => {
    const backend = result.selectedBackend || 'aws';
    const url = DASHBOARD_URLS[backend];
    chrome.tabs.create({ url });
  });
});

// Get token link
getTokenLink.addEventListener('click', () => {
  chrome.storage.local.get(['selectedBackend'], (result) => {
    const backend = result.selectedBackend || 'aws';
    const url = DASHBOARD_URLS[backend];
    chrome.tabs.create({ url });
  });
});

// Load stats
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['linkoGeneiToken']);
    const token = result.linkoGeneiToken;

    if (!token) return;

    const response = await fetch(`${API_URL}/linkogenei/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      savedCountEl.textContent = data.stats.total_posts || 0;
      categoryCountEl.textContent = data.stats.total_categories || 0;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// UI Helper Functions
function showLoginSection() {
  loginSection.classList.remove('hidden');
  activeSection.classList.add('hidden');
}

function showActiveSection() {
  loginSection.classList.add('hidden');
  activeSection.classList.remove('hidden');
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  
  setTimeout(() => {
    messageEl.className = 'message';
  }, 3000);
}
