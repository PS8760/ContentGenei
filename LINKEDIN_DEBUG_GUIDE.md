# LinkedIn Debug Guide

## 🐛 Issue

"Save to Genei" buttons are not appearing on LinkedIn posts.

---

## 🔍 Step 1: Check Console Logs

1. Open LinkedIn: https://www.linkedin.com/feed/
2. Open DevTools Console (F12)
3. Look for these logs:

```
LinkoGenei: Found X posts on linkedin
```

### If you see "Found 0 posts"

This means the post selectors are not matching LinkedIn's current HTML structure.

### If you don't see any logs

The extension might not be detecting LinkedIn as a platform, or the extension is not active.

---

## 🔧 Step 2: Run Diagnostic Script

1. Open LinkedIn: https://www.linkedin.com/feed/
2. Open DevTools Console (F12)
3. Copy and paste this entire script:

```javascript
// LinkedIn Diagnostic Script
console.log('🔍 LinkedIn Diagnostic Tool');
console.log('============================\n');

// Test different selectors
const selectors = [
  '.feed-shared-update-v2',
  '.occludable-update',
  'div[data-urn]',
  'div[data-id*="urn:li:activity"]',
  'div.feed-shared-update-v2__content',
  'article',
  '[data-id^="urn:li:activity"]',
  '.feed-shared-update-v2__wrapper',
  'div[class*="feed-shared-update"]',
  'div[class*="occludable"]'
];

console.log('Testing selectors:\n');

selectors.forEach(selector => {
  try {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements found`);
  } catch (e) {
    console.log(`${selector}: ❌ Error`);
  }
});

console.log('\n============================');
console.log('Looking for post links:\n');

const allLinks = document.querySelectorAll('a');
let postLinks = [];

allLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href && (href.includes('/posts/') || href.includes('activity-'))) {
    postLinks.push(href);
  }
});

console.log(`Found ${postLinks.length} post links`);
postLinks.slice(0, 5).forEach((link, i) => {
  console.log(`${i + 1}. ${link}`);
});
```

4. Press Enter
5. Look at the results

### What to Look For

**Good signs:**
```
.feed-shared-update-v2: 10 elements found  ✅
Found 15 post links  ✅
```

**Bad signs:**
```
.feed-shared-update-v2: 0 elements found  ❌
Found 0 post links  ❌
```

---

## 📊 Step 3: Analyze Results

### Scenario A: Selectors found posts (e.g., 10+ elements)

**Problem**: URL extraction is failing

**Solution**: The getUrl function needs to be fixed

### Scenario B: No selectors found posts (0 elements)

**Problem**: LinkedIn changed their HTML structure

**Solution**: Need to update the post selectors

### Scenario C: Post links found but no elements

**Problem**: The selector is too specific

**Solution**: Need to find the parent container of the links

---

## 🔧 Step 4: Manual Inspection

1. Open LinkedIn feed
2. Right-click on a post (not the content, but the container)
3. Select "Inspect" or "Inspect Element"
4. Look at the HTML structure

### What to Look For

Find the outermost container that wraps the entire post. Common patterns:

```html
<!-- Pattern 1: Classic -->
<div class="feed-shared-update-v2">
  <div class="feed-shared-update-v2__content">
    <!-- Post content -->
  </div>
</div>

<!-- Pattern 2: With data attributes -->
<div data-urn="urn:li:activity:123456789" class="feed-shared-update-v2">
  <!-- Post content -->
</div>

<!-- Pattern 3: New structure -->
<div data-id="urn:li:activity:123456789">
  <article>
    <!-- Post content -->
  </article>
</div>

<!-- Pattern 4: Simplified -->
<article class="update-components-article">
  <!-- Post content -->
</article>
```

### Copy the Class Names

Look for class names that contain:
- `feed`
- `update`
- `post`
- `article`
- `activity`

Example: `feed-shared-update-v2`, `occludable-update`, `update-components-article`

---

## 🛠️ Step 5: Update Selectors

Once you know the correct selector, update `extension/content.js`:

### Find this section:

```javascript
linkedin: {
  posts: '.feed-shared-update-v2, .occludable-update, div[data-urn]',
```

### Add your selector:

```javascript
linkedin: {
  posts: '.feed-shared-update-v2, .occludable-update, div[data-urn], .YOUR-SELECTOR-HERE',
```

### Example:

If you found posts use class `update-components-article`, add it:

```javascript
linkedin: {
  posts: '.feed-shared-update-v2, .occludable-update, div[data-urn], .update-components-article',
```

---

## 🧪 Step 6: Test the Fix

1. Save the file
2. Reload extension in Chrome (`chrome://extensions/` → Reload)
3. Hard refresh LinkedIn (Ctrl+Shift+R or Cmd+Shift+R)
4. Check console for: `LinkoGenei: Found X posts on linkedin`
5. Look for "Save to Genei" buttons

---

## 🔍 Step 7: Enable Debug Mode

For more detailed logs:

1. Edit `extension/manifest.json`
2. Find: `"js": ["content.js"]`
3. Change to: `"js": ["content-debug-v2.js"]`
4. Reload extension
5. Refresh LinkedIn
6. Check console for detailed logs with 🔍 emoji

---

## 📝 Common LinkedIn Selectors

Try these selectors if the current ones don't work:

```javascript
// Option 1: Classic selectors
posts: '.feed-shared-update-v2, .occludable-update'

// Option 2: With data attributes
posts: 'div[data-urn], div[data-id*="urn:li:activity"]'

// Option 3: Article-based
posts: 'article, .update-components-article'

// Option 4: Broad match
posts: 'div[class*="feed-shared-update"], div[class*="occludable"]'

// Option 5: Data attribute only
posts: '[data-id^="urn:li:activity"]'

// Option 6: Combined (current)
posts: '.feed-shared-update-v2, .occludable-update, div[data-urn], div.feed-shared-update-v2__content, article, div[data-id*="urn:li:activity"]'
```

---

## 🚨 Quick Fixes

### Fix 1: Use Broader Selector

```javascript
linkedin: {
  posts: 'div[class*="feed"], div[class*="update"], article',
```

This will match any div with "feed" or "update" in the class name.

### Fix 2: Use Data Attributes Only

```javascript
linkedin: {
  posts: '[data-urn], [data-id*="activity"]',
```

This relies on LinkedIn's data attributes instead of class names.

### Fix 3: Use Main Container Children

```javascript
linkedin: {
  posts: 'main > div > div, .core-rail > div > div',
```

This targets direct children of the main feed container.

---

## 📊 Verification

After applying a fix:

1. **Console shows posts found**:
   ```
   LinkoGenei: Found 10 posts on linkedin
   ```

2. **Buttons appear on posts**:
   Look for purple "Save to Genei" buttons

3. **URLs are extracted**:
   ```
   LinkoGenei: Post #1 URL: https://www.linkedin.com/posts/...
   ```

4. **Clicking works**:
   Click "Save to Genei" and verify it saves

---

## 🆘 If Still Not Working

### Share These Details

1. **Console logs** (copy all LinkoGenei messages)
2. **Diagnostic script results** (copy the output)
3. **HTML structure** (right-click post → Inspect → copy outer HTML)
4. **LinkedIn version** (are you using the new or old LinkedIn?)

### Temporary Workaround

Use the debug version and manually inspect:

1. Enable debug mode
2. Open console
3. Run: `document.querySelectorAll('div[class*="feed"]')`
4. See how many elements are found
5. Try different selectors until you find one that works

---

## 📚 Additional Resources

- `extension/linkedin-diagnostic.js` - Diagnostic script file
- `extension/content.js` - Main content script
- `extension/content-debug-v2.js` - Debug version

---

## 🎯 Expected Behavior

When working correctly:

1. Open LinkedIn feed
2. See "Save to Genei" button on each post (top-right corner)
3. Console shows: `LinkoGenei: Found X posts on linkedin`
4. Clicking button saves the post
5. MongoDB has the post URL
6. Dashboard shows the saved post

---

## ✅ Success Checklist

- [ ] Ran diagnostic script
- [ ] Found correct selector
- [ ] Updated content.js
- [ ] Reloaded extension
- [ ] Hard refreshed LinkedIn
- [ ] Console shows posts found
- [ ] Buttons appear on posts
- [ ] Clicking saves posts
- [ ] MongoDB has correct URLs

---

Let me know the results of the diagnostic script and I'll help you find the correct selector!
