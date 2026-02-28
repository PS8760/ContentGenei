// Popup script for LinkoGenei extension

const API_URL = 'http://localhost:5001/api';

// DOM Elements
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

// Check if extension is already activated
chrome.storage.local.get(['linkoGeneiToken', 'linkoGeneiActive'], (result) => {
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
  chrome.tabs.create({ 
    url: 'http://localhost:5173/linkogenei' 
  });
});

// Get token link
getTokenLink.addEventListener('click', () => {
  chrome.tabs.create({ 
    url: 'http://localhost:5173/linkogenei' 
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
