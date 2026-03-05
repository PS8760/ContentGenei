# 🎯 Toast Notification Quick Reference

## Import
```javascript
import ToastManager from '../utils/ToastManager'
```

## Basic Usage

### Success Toast
```javascript
ToastManager.success(
  'Title',
  'Message',
  [], // optional actions
  5000 // duration in ms
)
```

### Error Toast
```javascript
ToastManager.error(
  'Error Title',
  'Error message with details',
  [], // optional actions
  7000 // longer duration for errors
)
```

### Warning Toast
```javascript
ToastManager.warning(
  'Warning Title',
  'Warning message',
  [],
  6000
)
```

### Info Toast
```javascript
ToastManager.info(
  'Info Title',
  'Information message',
  [],
  5000
)
```

### Loading Toast (doesn't auto-dismiss)
```javascript
const loadingId = ToastManager.loading(
  'Processing...',
  'Please wait while we process your request.'
)

// Later, remove it:
ToastManager.removeToast(loadingId)

// Or update it to success/error:
ToastManager.update(loadingId, 'success', 'Complete!', 'Processing finished.')
```

## With Action Buttons

```javascript
ToastManager.success(
  'Content Saved!',
  'Your content has been saved to the library.',
  [
    {
      label: 'View Library',
      onClick: "window.location.href='/dashboard'",
      primary: true // blue gradient button
    },
    {
      label: 'Continue',
      onClick: "document.getElementById(arguments[0]).remove()",
      primary: false // gray button
    }
  ],
  8000
)
```

## Specialized Methods

### Save Success
```javascript
ToastManager.saveSuccess('Content')
// Shows: "Content Saved!" with View Library and Continue buttons
```

### Copy Success
```javascript
ToastManager.copySuccess()
// Shows: "Copied!" for 2 seconds
```

### Processing File
```javascript
const id = ToastManager.processingFile('video')
// Shows loading toast: "Processing video..."
// Remember to remove it when done!
ToastManager.removeToast(id)
```

### Extraction Success
```javascript
ToastManager.extractionSuccess(1234, ' Title: My Article')
// Shows: "Extraction Complete! Found 1234 words. Title: My Article"
```

### Validation Error
```javascript
ToastManager.validationError('URL', 'Please enter a valid URL.')
// Shows: "Invalid URL - Please enter a valid URL."
```

### Network Error
```javascript
ToastManager.networkError()
// Shows error with Retry button (doesn't auto-dismiss)
```

## Common Patterns

### File Upload with Loading State
```javascript
const loadingId = ToastManager.loading('Uploading...', 'Please wait.')

try {
  const result = await uploadFile(file)
  ToastManager.removeToast(loadingId)
  ToastManager.success('Upload Complete!', `File uploaded: ${result.filename}`)
} catch (error) {
  ToastManager.removeToast(loadingId)
  ToastManager.error('Upload Failed', error.message)
}
```

### API Call with Error Handling
```javascript
try {
  const data = await apiService.getData()
  ToastManager.success('Data Loaded', 'Successfully loaded data.')
} catch (error) {
  ToastManager.error(
    'Failed to Load Data',
    'Please check your connection and try again.',
    [
      { label: 'Retry', onClick: 'window.location.reload()', primary: true }
    ],
    0 // Don't auto-dismiss
  )
}
```

### Form Validation
```javascript
if (!email) {
  ToastManager.validationError('Email', 'Please enter your email address.')
  return
}

if (!isValidEmail(email)) {
  ToastManager.validationError('Email', 'Please enter a valid email address.')
  return
}
```

### Long Operation with Progress
```javascript
const loadingId = ToastManager.loading('Processing...', 'Step 1 of 3')

// Update progress
ToastManager.update(loadingId, 'loading', 'Processing...', 'Step 2 of 3')

// Update again
ToastManager.update(loadingId, 'loading', 'Processing...', 'Step 3 of 3')

// Complete
ToastManager.update(loadingId, 'success', 'Complete!', 'All steps finished.')
```

## Tips

1. **Duration Guidelines:**
   - Success: 3-5 seconds
   - Info: 5-6 seconds
   - Warning: 6-7 seconds
   - Error: 7-10 seconds (or 0 for critical errors)
   - Loading: 0 (manual dismiss)

2. **Action Buttons:**
   - Use `primary: true` for the main action (blue gradient)
   - Use `primary: false` for secondary actions (gray)
   - Keep button labels short (1-2 words)

3. **Messages:**
   - Title: Short and clear (2-4 words)
   - Message: Helpful and specific (1-2 sentences)
   - Include next steps or troubleshooting tips

4. **Loading Toasts:**
   - Always store the ID: `const id = ToastManager.loading(...)`
   - Always remove when done: `ToastManager.removeToast(id)`
   - Or update to success/error: `ToastManager.update(id, 'success', ...)`

5. **Error Handling:**
   - Provide specific error messages
   - Include troubleshooting tips
   - Offer retry options when appropriate
   - Use 0 duration for critical errors (user must dismiss)

## Replace These Patterns

### ❌ Don't Use
```javascript
alert('Success!')
alert('Error: ' + error.message)
window.confirm('Are you sure?')
```

### ✅ Use Instead
```javascript
ToastManager.success('Success!', 'Operation completed.')
ToastManager.error('Error', error.message)
// For confirms, use a modal (see ContentLibrary.jsx example)
```

## Dark Mode

All toasts automatically support dark mode! No extra code needed.

## Stacking

Multiple toasts automatically stack vertically in the top-right corner.

## Manual Close

All toasts have an X button in the top-right corner for manual dismissal.

## Clear All

```javascript
ToastManager.clearAll()
// Removes all toasts from the screen
```

---

## Examples from Content Genie

### Creator Page - Content Loaded
```javascript
ToastManager.info(
  'Content Loaded!',
  'You can now continue refining this content or generate new variations.',
  [],
  6000
)
```

### Creator Page - OCR Success
```javascript
ToastManager.success(
  'Text Extracted!',
  `Found ${response.word_count} words with ${response.confidence}% confidence.`,
  [],
  5000
)
```

### Creator Page - Transcription
```javascript
const loadingId = ToastManager.loading(
  'Transcribing video...',
  'This may take a moment. Please wait.'
)

// ... after transcription ...

ToastManager.removeToast(loadingId)
ToastManager.success(
  'Transcription Complete!',
  `Video transcribed successfully! Found ${wordCount} words.`,
  [],
  5000
)
```

### Content Library - Delete Success
```javascript
ToastManager.success(
  'Content Deleted',
  'The content has been removed from your library.',
  [],
  3000
)
```

---

## Need Help?

Check `frontend/src/utils/ToastManager.js` for the full implementation and all available methods.
