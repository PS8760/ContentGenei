// Content script for LinkoGenei - Injects "Save to Genei" buttons

const API_URL = 'http://localhost:5001/api';
let isActive = false;
let authToken = null;

// Platform-specific selectors
const PLATFORM_SELECTORS = {
  instagram: {
    posts: 'article[role="presentation"], article',
    getUrl: (element) => {
      // Try multiple selectors to find the post link
      let link = element.querySelector('a[href*="/p/"]');
      
      // If not found, try looking in the header area
      if (!link) {
        link = element.querySelector('header a[href*="/p/"]');
      }
      
      // Try looking for time element's parent link
      if (!link) {
        const timeElement = element.querySelector('time');
        if (timeElement) {
          link = timeElement.closest('a[href*="/p/"]');
        }
      }
      
      if (link) {
        const href = link.getAttribute('href');
        // Clean the URL - remove query parameters and get just the post ID
        const cleanHref = href.split('?')[0];
        return `https://www.instagram.com${cleanHref}`;
      }
      
      console.warn('LinkoGenei: Could not find post URL for Instagram post', element);
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'Instagram'
  },
  linkedin: {
    posts: 'div.feed-shared-update-v2, div.occludable-update, div[data-urn], div[data-id*="urn:li:activity"], div[data-id^="urn:li:activity"], div[class*="feed-shared-update"], div[class*="occludable"], div[data-urn*="activity"], main > div > div > div',
    getUrl: (element) => {
      console.log('🔍 LinkedIn: Extracting URL from element');
      
      // Method 1: Look for timestamp link (most reliable)
      let link = element.querySelector('a[href*="/posts/"] span.visually-hidden');
      if (link) {
        link = link.closest('a');
        console.log('🔍 LinkedIn: Found via timestamp (Method 1)');
      }
      
      // Method 2: Look for any link with /posts/
      if (!link) {
        link = element.querySelector('a[href*="/posts/"]');
        console.log('🔍 LinkedIn: Found via /posts/ selector (Method 2)');
      }
      
      // Method 3: Look for activity link
      if (!link) {
        link = element.querySelector('a[href*="activity-"]');
        console.log('🔍 LinkedIn: Found via activity selector (Method 3)');
      }
      
      // Method 4: Look for feed/update URN in href
      if (!link) {
        link = element.querySelector('a[href*="urn:li:activity"]');
        console.log('🔍 LinkedIn: Found via URN selector (Method 4)');
      }
      
      // Method 5: Look in time element
      if (!link) {
        const timeElement = element.querySelector('time');
        if (timeElement) {
          link = timeElement.closest('a');
          console.log('🔍 LinkedIn: Found via time element (Method 5)');
        }
      }
      
      // Method 6: Look for any link in the header area
      if (!link) {
        const header = element.querySelector('[class*="feed-shared-actor"], [class*="update-components-actor"]');
        if (header) {
          link = header.querySelector('a[href*="/posts/"], a[href*="activity-"]');
          console.log('🔍 LinkedIn: Found via header (Method 6)');
        }
      }
      
      // Method 7: Search all links for post URLs (most aggressive)
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log(`🔍 LinkedIn: Searching ${allLinks.length} links (Method 7)`);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          console.log(`  Checking: ${href}`);
          if (href && (href.includes('/posts/') || href.includes('activity-') || href.includes('urn:li:activity'))) {
            link = a;
            console.log('🔍 LinkedIn: Found link:', href);
            break;
          }
        }
      }
      
      // Method 8: Check data attributes on the element itself
      if (!link) {
        const dataUrn = element.getAttribute('data-urn') || element.getAttribute('data-id');
        if (dataUrn && dataUrn.includes('activity')) {
          console.log('🔍 LinkedIn: Found URN in data attribute (Method 8):', dataUrn);
          // Extract activity ID from URN
          const activityMatch = dataUrn.match(/activity[:-](\d+)/);
          if (activityMatch) {
            const activityId = activityMatch[1];
            const fullUrl = `https://www.linkedin.com/feed/update/urn:li:activity:${activityId}`;
            console.log('✅ LinkedIn: Constructed URL from URN:', fullUrl);
            return fullUrl;
          }
        }
      }
      
      if (link) {
        const href = link.getAttribute('href');
        console.log('🔍 LinkedIn: Raw href:', href);
        
        // Clean the URL
        const cleanHref = href.split('?')[0].split('#')[0];
        const fullUrl = cleanHref.startsWith('http') ? cleanHref : `https://www.linkedin.com${cleanHref}`;
        console.log('✅ LinkedIn: Final URL:', fullUrl);
        return fullUrl;
      }
      
      console.warn('❌ LinkedIn: Could not find post URL');
      console.warn('Element HTML:', element.outerHTML.substring(0, 500));
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'LinkedIn'
  },
  twitter: {
    posts: 'article[data-testid="tweet"], article[role="article"]',
    getUrl: (element) => {
      console.log('🔍 Twitter: Extracting URL from element');
      
      // Method 1: Look for time element's parent link (most reliable)
      let link = null;
      const timeElement = element.querySelector('time');
      if (timeElement) {
        link = timeElement.closest('a[href*="/status/"]');
        console.log('🔍 Twitter: Found via time element (Method 1)');
      }
      
      // Method 2: Direct selector for status link
      if (!link) {
        link = element.querySelector('a[href*="/status/"]');
        console.log('🔍 Twitter: Found via status selector (Method 2)');
      }
      
      // Method 3: Search all links
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log(`🔍 Twitter: Searching ${allLinks.length} links (Method 3)`);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          if (href && href.includes('/status/')) {
            link = a;
            console.log('🔍 Twitter: Found link:', href);
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
      
      console.warn('❌ Twitter: Could not find post URL');
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'Twitter'
  },
  x: {
    posts: 'article[data-testid="tweet"], article[role="article"]',
    getUrl: (element) => {
      console.log('🔍 X: Extracting URL from element');
      
      // Method 1: Look for time element's parent link (most reliable)
      let link = null;
      const timeElement = element.querySelector('time');
      if (timeElement) {
        link = timeElement.closest('a[href*="/status/"]');
        console.log('🔍 X: Found via time element (Method 1)');
      }
      
      // Method 2: Direct selector for status link
      if (!link) {
        link = element.querySelector('a[href*="/status/"]');
        console.log('🔍 X: Found via status selector (Method 2)');
      }
      
      // Method 3: Search all links
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log(`🔍 X: Searching ${allLinks.length} links (Method 3)`);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          if (href && href.includes('/status/')) {
            link = a;
            console.log('🔍 X: Found link:', href);
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
      
      console.warn('❌ X: Could not find post URL');
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'X (Twitter)'
  },
  youtube: {
    posts: 'ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer',
    getUrl: (element) => {
      console.log('🔍 YouTube: Extracting URL from element');
      
      // Method 1: Look for video link in title
      let link = element.querySelector('a#video-title, a#video-title-link');
      if (link) {
        console.log('🔍 YouTube: Found via video title (Method 1)');
      }
      
      // Method 2: Look for thumbnail link
      if (!link) {
        link = element.querySelector('a#thumbnail');
        console.log('🔍 YouTube: Found via thumbnail (Method 2)');
      }
      
      // Method 3: Look for any link with /watch?v=
      if (!link) {
        link = element.querySelector('a[href*="/watch?v="]');
        console.log('🔍 YouTube: Found via watch link (Method 3)');
      }
      
      // Method 4: Look for shorts link
      if (!link) {
        link = element.querySelector('a[href*="/shorts/"]');
        console.log('🔍 YouTube: Found via shorts link (Method 4)');
      }
      
      // Method 5: Search all links
      if (!link) {
        const allLinks = element.querySelectorAll('a');
        console.log(`🔍 YouTube: Searching ${allLinks.length} links (Method 5)`);
        for (const a of allLinks) {
          const href = a.getAttribute('href');
          if (href && (href.includes('/watch?v=') || href.includes('/shorts/'))) {
            link = a;
            console.log('🔍 YouTube: Found link:', href);
            break;
          }
        }
      }
      
      if (link) {
        const href = link.getAttribute('href');
        console.log('🔍 YouTube: Raw href:', href);
        
        // Clean the URL and ensure it's absolute
        let cleanHref = href.split('&')[0]; // Remove extra parameters
        const fullUrl = cleanHref.startsWith('http') ? cleanHref : `https://www.youtube.com${cleanHref}`;
        console.log('✅ YouTube: Final URL:', fullUrl);
        return fullUrl;
      }
      
      console.warn('❌ YouTube: Could not find video URL');
      return null;
    },
    buttonPosition: 'top-right',
    platform: 'YouTube'
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
  if (hostname.includes('youtube.com')) {
    console.log('✅ Platform detected: YouTube');
    return 'youtube';
  }
  
  console.log('❌ Platform not supported');
  return null;
}

// Initialize extension
async function init() {
  const result = await chrome.storage.local.get(['linkoGeneiActive', 'linkoGeneiToken']);
  isActive = result.linkoGeneiActive || false;
  authToken = result.linkoGeneiToken || null;

  if (isActive && authToken) {
    startObserving();
  }
}

// Start observing for new posts
function startObserving() {
  const platform = detectPlatform();
  if (!platform) return;

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
}

// Add buttons to all posts on the page
function addButtonsToExistingPosts(platform) {
  const config = PLATFORM_SELECTORS[platform];
  if (!config) return;

  let posts = document.querySelectorAll(config.posts);
  
  // LinkedIn fallback: if no posts found, try finding by post links
  if (platform === 'linkedin' && posts.length === 0) {
    console.log('🔍 LinkedIn: No posts found with selectors, trying fallback...');
    const postLinks = document.querySelectorAll('a[href*="/posts/"], a[href*="activity-"]');
    console.log(`🔍 LinkedIn: Found ${postLinks.length} post links`);
    
    // Get unique parent containers
    const containers = new Set();
    postLinks.forEach(link => {
      let parent = link;
      // Go up 8 levels to find the post container (increased from 5)
      for (let i = 0; i < 8; i++) {
        parent = parent.parentElement;
        if (parent) {
          // Check if this looks like a post container
          const rect = parent.getBoundingClientRect();
          const hasReasonableSize = rect.height > 100 && rect.width > 300;
          const hasPostClasses = parent.className && (
            parent.className.includes('feed') || 
            parent.className.includes('update') ||
            parent.className.includes('post')
          );
          
          if (hasReasonableSize || hasPostClasses) {
            containers.add(parent);
            console.log(`🔍 LinkedIn: Found container at level ${i}:`, parent.className);
            break;
          }
        }
      }
    });
    
    posts = Array.from(containers);
    console.log(`🔍 LinkedIn: Found ${posts.length} post containers via fallback`);
  }
  
  console.log(`LinkoGenei: Found ${posts.length} posts on ${platform}`);
  
  posts.forEach((post, index) => {
    // Skip if button already exists
    if (post.querySelector('.linkogenei-save-btn')) return;

    const url = config.getUrl(post);
    
    if (!url) {
      console.warn(`LinkoGenei: Could not extract URL for post #${index + 1}`);
      return;
    }
    
    console.log(`LinkoGenei: Post #${index + 1} URL:`, url);

    // Create and inject button
    const button = createSaveButton(url, config.platform, post);
    injectButton(post, button, config.buttonPosition);
  });
}

// Create save button
function createSaveButton(postUrl, platformName, postElement) {
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
    await savePost(postUrl, platformName, button, postElement);
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

// Extract image from post
function extractImageFromPost(postElement, platform) {
  let imageUrl = null;
  
  try {
    // Try to find the first image in the post
    let img = null;
    
    if (platform === 'Instagram') {
      // Instagram: Look for post images
      img = postElement.querySelector('img[src*="instagram"]');
      if (!img) img = postElement.querySelector('article img');
    } else if (platform === 'LinkedIn') {
      // LinkedIn: Look for shared images
      img = postElement.querySelector('img[src*="media.licdn.com"]');
      if (!img) img = postElement.querySelector('.feed-shared-image img');
      if (!img) img = postElement.querySelector('img[alt]');
    } else if (platform === 'Twitter' || platform === 'X (Twitter)') {
      // Twitter/X: Look for tweet images
      img = postElement.querySelector('img[src*="pbs.twimg.com"]');
      if (!img) img = postElement.querySelector('div[data-testid="tweetPhoto"] img');
      if (!img) img = postElement.querySelector('article img[alt]');
    } else if (platform === 'YouTube') {
      // YouTube: Look for video thumbnails
      img = postElement.querySelector('img#img, img.yt-core-image');
      if (!img) img = postElement.querySelector('img[src*="i.ytimg.com"]');
      if (!img) img = postElement.querySelector('yt-image img');
    }
    
    // Get the image URL
    if (img) {
      imageUrl = img.src || img.getAttribute('src');
      console.log('LinkoGenei: Extracted image:', imageUrl);
    } else {
      console.log('LinkoGenei: No image found in post');
    }
  } catch (error) {
    console.warn('LinkoGenei: Error extracting image:', error);
  }
  
  return imageUrl;
}

// Save post to backend
async function savePost(url, platform, button, postElement) {
  if (!authToken) {
    showNotification('Please activate the extension first', 'error');
    return;
  }
  
  console.log('LinkoGenei: Saving post...', { url, platform });
  
  // Extract image from post
  const imageUrl = extractImageFromPost(postElement, platform);

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
    console.log('LinkoGenei: Sending request to backend...', {
      url: `${API_URL}/linkogenei/save-post`,
      postUrl: url,
      platform: platform
    });
    
    const response = await fetch(`${API_URL}/linkogenei/save-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        url: url,
        platform: platform,
        title: document.title,
        image_url: imageUrl,
        saved_at: new Date().toISOString()
      })
    });

    console.log('LinkoGenei: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LinkoGenei: Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('LinkoGenei: Response data:', data);

    if (response.ok && data.success) {
      // Success state
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Saved!</span>
      `;
      button.classList.add('saved');
      showNotification(`Post saved successfully! URL: ${url}`, 'success');
    } else {
      throw new Error(data.error || 'Failed to save post');
    }
  } catch (error) {
    console.error('LinkoGenei: Save error:', error);
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
  }, 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'activate') {
    isActive = true;
    authToken = message.token;
    startObserving();
  } else if (message.action === 'deactivate') {
    isActive = false;
    authToken = null;
    // Remove all buttons
    document.querySelectorAll('.linkogenei-save-btn').forEach(btn => btn.remove());
  }
});

// Initialize on load
init();
