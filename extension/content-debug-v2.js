// Content script for LinkoGenei - DEBUG VERSION with detailed logging

const API_URL = 'http://localhost:5001/api';
let isActive = false;
let authToken = null;

console.log('🔍 LinkoGenei DEBUG: Content script loaded');

// Platform-specific selectors
const PLATFORM_SELECTORS = {
  instagram: {
    posts: 'article[role="presentation"], article',
    getUrl: (element) => {
      console.log('🔍 Instagram: Extracting URL from element:', element);
      
      // Try multiple selectors to find the post link
      let link = element.querySelector('a[href*="/p/"]');
      console.log('🔍 Instagram: First attempt (a[href*="/p/"]):', link);
      
      // If not found, try looking in the header area
      if (!link) {
        link = element.querySelector('header a[href*="/p/"]');
        console.log('🔍 Instagram: Second attempt (header a[href*="/p/"]):', link);
      }
      
      // Try looking for time element's parent link
      if (!link) {
        const timeElement = element.querySelector('time');
        console.log('🔍 Instagram: Found time element:', timeElement);
        if (timeElement) {
          link = timeElement.closest('a[href*="/p/"]');
          console.log('🔍 Instagram: Third attempt (time closest a):', link);
        }
      }
      
      // Try looking for any link with /p/ in the article
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log('🔍 Instagram: All links in post:', allLinks.length);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          console.log('🔍 Instagram: Checking link:', href);
          if (href && href.includes('/p/')) {
            link = a;
            console.log('🔍 Instagram: Found link with /p/:', link);
            break;
          }
        }
      }
      
      if (link) {
        const href = link.getAttribute('href');
        console.log('🔍 Instagram: Raw href:', href);
        
        // Clean the URL - remove query parameters and get just the post ID
        const cleanHref = href.split('?')[0];
        const fullUrl = `https://www.instagram.com${cleanHref}`;
        console.log('✅ Instagram: Final URL:', fullUrl);
        return fullUrl;
      }
      
      console.error('❌ Instagram: Could not find post URL');
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'Instagram'
  },
  linkedin: {
    posts: '.feed-shared-update-v2, .occludable-update, div[data-urn]',
    getUrl: (element) => {
      console.log('🔍 LinkedIn: Extracting URL from element:', element);
      
      // Method 1: Look for timestamp link (most reliable)
      let link = element.querySelector('a[href*="/posts/"] span.visually-hidden');
      if (link) {
        link = link.closest('a');
        console.log('🔍 LinkedIn: Found via timestamp (Method 1):', link);
      }
      
      // Method 2: Look for any link with /posts/
      if (!link) {
        link = element.querySelector('a[href*="/posts/"]');
        console.log('🔍 LinkedIn: Found via /posts/ selector (Method 2):', link);
      }
      
      // Method 3: Look for activity link
      if (!link) {
        link = element.querySelector('a[href*="activity-"]');
        console.log('🔍 LinkedIn: Found via activity selector (Method 3):', link);
      }
      
      // Method 4: Look in time element
      if (!link) {
        const timeElement = element.querySelector('time');
        console.log('🔍 LinkedIn: Found time element:', timeElement);
        if (timeElement) {
          link = timeElement.closest('a');
          console.log('🔍 LinkedIn: Found via time element (Method 4):', link);
        }
      }
      
      // Method 5: Search all links for post URLs
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log('🔍 LinkedIn: All links in post:', allLinks.length);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          console.log('🔍 LinkedIn: Checking link:', href);
          if (href && (href.includes('/posts/') || href.includes('activity-'))) {
            link = a;
            console.log('🔍 LinkedIn: Found link with post URL:', link);
            break;
          }
        }
      }
      
      if (link) {
        const href = link.getAttribute('href');
        console.log('🔍 LinkedIn: Raw href:', href);
        
        const cleanHref = href.split('?')[0].split('#')[0];
        const fullUrl = cleanHref.startsWith('http') ? cleanHref : `https://www.linkedin.com${cleanHref}`;
        console.log('✅ LinkedIn: Final URL:', fullUrl);
        return fullUrl;
      }
      
      console.error('❌ LinkedIn: Could not find post URL');
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'LinkedIn'
  },
  twitter: {
    posts: 'article[data-testid="tweet"], article[role="article"]',
    getUrl: (element) => {
      console.log('🔍 Twitter: Extracting URL from element:', element);
      
      // Method 1: Look for time element's parent link (most reliable)
      let link = null;
      const timeElement = element.querySelector('time');
      console.log('🔍 Twitter: Found time element:', timeElement);
      if (timeElement) {
        link = timeElement.closest('a[href*="/status/"]');
        console.log('🔍 Twitter: Found via time element (Method 1):', link);
      }
      
      // Method 2: Direct selector for status link
      if (!link) {
        link = element.querySelector('a[href*="/status/"]');
        console.log('🔍 Twitter: Found via status selector (Method 2):', link);
      }
      
      // Method 3: Search all links
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log('🔍 Twitter: All links in tweet:', allLinks.length);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          console.log('🔍 Twitter: Checking link:', href);
          if (href && href.includes('/status/')) {
            link = a;
            console.log('🔍 Twitter: Found link with /status/:', link);
            break;
          }
        }
      }
      
      if (link) {
        const href = link.getAttribute('href');
        console.log('🔍 Twitter: Raw href:', href);
        
        const cleanHref = href.split('?')[0].split('#')[0];
        const fullUrl = cleanHref.startsWith('http') ? cleanHref : `https://twitter.com${cleanHref}`;
        console.log('✅ Twitter: Final URL:', fullUrl);
        return fullUrl;
      }
      
      console.error('❌ Twitter: Could not find post URL');
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'Twitter'
  },
  x: {
    posts: 'article[data-testid="tweet"], article[role="article"]',
    getUrl: (element) => {
      console.log('🔍 X: Extracting URL from element:', element);
      
      // Method 1: Look for time element's parent link (most reliable)
      let link = null;
      const timeElement = element.querySelector('time');
      console.log('🔍 X: Found time element:', timeElement);
      if (timeElement) {
        link = timeElement.closest('a[href*="/status/"]');
        console.log('🔍 X: Found via time element (Method 1):', link);
      }
      
      // Method 2: Direct selector for status link
      if (!link) {
        link = element.querySelector('a[href*="/status/"]');
        console.log('🔍 X: Found via status selector (Method 2):', link);
      }
      
      // Method 3: Search all links
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log('🔍 X: All links in tweet:', allLinks.length);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          console.log('🔍 X: Checking link:', href);
          if (href && href.includes('/status/')) {
            link = a;
            console.log('🔍 X: Found link with /status/:', link);
            break;
          }
        }
      }
      
      if (link) {
        const href = link.getAttribute('href');
        console.log('🔍 X: Raw href:', href);
        
        const cleanHref = href.split('?')[0].split('#')[0];
        const fullUrl = cleanHref.startsWith('http') ? cleanHref : `https://x.com${cleanHref}`;
        console.log('✅ X: Final URL:', fullUrl);
        return fullUrl;
      }
      
      console.error('❌ X: Could not find post URL');
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'X (Twitter)'
  }
};

// Detect current platform
function detectPlatform() {
  const hostname = window.location.hostname;
  console.log('🔍 Detecting platform from hostname:', hostname);
  
  if (hostname.includes('instagram.com')) {
    console.log('✅ Platform detected: Instagram');
    return 'instagram';
  }
  if (hostname.includes('linkedin.com')) {
    console.log('✅ Platform detected: LinkedIn');
    return 'linkedin';
  }
  if (hostname.includes('twitter.com')) {
    console.log('✅ Platform detected: Twitter');
    return 'twitter';
  }
  if (hostname.includes('x.com')) {
    console.log('✅ Platform detected: X');
    return 'x';
  }
  
  console.log('❌ Platform not supported');
  return null;
}

// Initialize extension
async function init() {
  console.log('🔍 Initializing LinkoGenei...');
  
  const result = await chrome.storage.local.get(['linkoGeneiActive', 'linkoGeneiToken']);
  isActive = result.linkoGeneiActive || false;
  authToken = result.linkoGeneiToken || null;

  console.log('🔍 Extension status:', { isActive, hasToken: !!authToken });

  if (isActive && authToken) {
    console.log('✅ Extension is active, starting observer...');
    startObserving();
  } else {
    console.log('⚠️ Extension is not active or no token');
  }
}

// Start observing for new posts
function startObserving() {
  const platform = detectPlatform();
  if (!platform) {
    console.log('❌ Cannot start observing: platform not detected');
    return;
  }

  console.log('✅ Starting to observe posts on', platform);

  // Add buttons to existing posts
  addButtonsToExistingPosts(platform);

  // Observe for new posts
  const observer = new MutationObserver(() => {
    addButtonsToExistingPosts(platform);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ Observer started');
}

// Add buttons to all posts on the page
function addButtonsToExistingPosts(platform) {
  const config = PLATFORM_SELECTORS[platform];
  if (!config) {
    console.log('❌ No config for platform:', platform);
    return;
  }

  const posts = document.querySelectorAll(config.posts);
  
  console.log(`🔍 Found ${posts.length} posts on ${platform}`);
  
  posts.forEach((post, index) => {
    // Skip if button already exists
    if (post.querySelector('.linkogenei-save-btn')) {
      console.log(`⏭️ Post #${index + 1}: Button already exists, skipping`);
      return;
    }

    console.log(`🔍 Processing post #${index + 1}...`);
    const url = config.getUrl(post);
    
    if (!url) {
      console.warn(`❌ Post #${index + 1}: Could not extract URL`);
      return;
    }
    
    console.log(`✅ Post #${index + 1} URL extracted:`, url);

    // Create and inject button
    const button = createSaveButton(url, config.platform);
    injectButton(post, button, config.buttonPosition);
    console.log(`✅ Post #${index + 1}: Button injected`);
  });
}

// Create save button
function createSaveButton(postUrl, platformName) {
  console.log('🔍 Creating button for URL:', postUrl);
  
  const button = document.createElement('button');
  button.className = 'linkogenei-save-btn';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
    <span>Save to Genei</span>
  `;

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 Button clicked! Saving URL:', postUrl);
    await savePost(postUrl, platformName, button);
  });

  return button;
}

// Inject button into post
function injectButton(post, button, position) {
  // Make post position relative for absolute positioning
  if (getComputedStyle(post).position === 'static') {
    post.style.position = 'relative';
  }

  post.appendChild(button);
}

// Save post to backend
async function savePost(url, platform, button) {
  console.log('🔍 savePost called with:', { url, platform });
  
  if (!authToken) {
    console.error('❌ No auth token');
    showNotification('Please activate the extension first', 'error');
    return;
  }

  // Update button state
  button.disabled = true;
  button.innerHTML = `
    <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>
    <span>Saving...</span>
  `;

  try {
    const requestData = {
      url: url,
      platform: platform,
      title: document.title,
      saved_at: new Date().toISOString()
    };
    
    console.log('🔍 Sending request to backend:', {
      endpoint: `${API_URL}/linkogenei/save-post`,
      data: requestData
    });
    
    const response = await fetch(`${API_URL}/linkogenei/save-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestData)
    });

    console.log('🔍 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Response data:', data);

    if (response.ok && data.success) {
      // Success state
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Saved!</span>
      `;
      button.classList.add('saved');
      showNotification(`✅ Post saved! URL: ${url}`, 'success');
      console.log('✅ Post saved successfully!');
    } else {
      throw new Error(data.error || 'Failed to save post');
    }
  } catch (error) {
    console.error('❌ Save error:', error);
    button.disabled = false;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>Save to Genei</span>
    `;
    
    // Show specific error message
    let errorMessage = 'Failed to save post';
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Make sure backend is running on port 5001.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Invalid token. Please generate a new token from the dashboard.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification(errorMessage, 'error');
  }
}

// Show notification
function showNotification(message, type) {
  console.log(`🔍 Notification (${type}):`, message);
  
  const notification = document.createElement('div');
  notification.className = `linkogenei-notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔍 Message received:', message);
  
  if (message.action === 'activate') {
    console.log('✅ Activating extension...');
    isActive = true;
    authToken = message.token;
    startObserving();
  } else if (message.action === 'deactivate') {
    console.log('⚠️ Deactivating extension...');
    isActive = false;
    authToken = null;
    // Remove all buttons
    document.querySelectorAll('.linkogenei-save-btn').forEach(btn => btn.remove());
  }
});

// Initialize on load
console.log('🔍 Starting initialization...');
init();
