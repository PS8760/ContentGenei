# LinkoGenei Chrome Extension

Save posts from Instagram, LinkedIn, Twitter/X, and Facebook directly to your ContentGenie dashboard.

## Features

- 🔗 One-click save button on every social media post
- 📁 Organize posts into custom categories
- 🔐 Secure token-based authentication
- 📊 Track your saved posts with statistics
- 🎨 Beautiful, non-intrusive UI

## Installation

### From Source (Development)

1. Clone the ContentGenei repository
2. Navigate to the `extension` folder
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the `extension` folder

### From Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store soon!

## Setup

1. **Generate Access Token**
   - Open ContentGenie dashboard at http://localhost:5173
   - Navigate to LinkoGenei page
   - Click "Generate Access Token"
   - Copy the generated token

2. **Activate Extension**
   - Click the LinkoGenei extension icon in Chrome
   - Paste your access token
   - Click "Activate Extension"

3. **Start Saving Posts**
   - Visit Instagram, LinkedIn, Twitter, or Facebook
   - Look for the "Save to Genei" button on posts
   - Click to save any post to your dashboard

## Supported Platforms

- ✅ Instagram
- ✅ LinkedIn
- ✅ Twitter/X
- ✅ Facebook

## Usage

### Saving a Post

1. Browse your favorite social media platform
2. Find a post you want to save
3. Click the "Save to Genei" button (top-right corner of post)
4. Post is instantly saved to your dashboard

### Managing Saved Posts

1. Open ContentGenie dashboard
2. Go to LinkoGenei page
3. View all your saved posts
4. Filter by category or platform
5. Edit categories, add notes, or delete posts

### Creating Categories

1. Go to LinkoGenei dashboard
2. Click "+ New Category"
3. Enter category name (e.g., "Coding", "Vlogging", "Daily Updates")
4. Posts can be organized into these categories

## Features in Detail

### Save Button
- Appears on every post automatically
- Non-intrusive design
- Instant feedback on save
- Shows "Saved!" when complete

### Dashboard
- View all saved posts in one place
- Filter by category or platform
- Search and organize posts
- Direct links to original posts

### Categories
- Create unlimited categories
- Organize posts by topic
- Track post count per category
- Easy category management

### Statistics
- Total posts saved
- Posts by platform
- Posts by category
- Activity tracking

## Privacy & Security

- 🔒 All data is stored securely in MongoDB
- 🔐 Token-based authentication
- 🚫 No passwords stored in extension
- ✅ Only saves post URLs, not content
- 🛡️ HTTPS-only communication

## Troubleshooting

### Extension Not Working

1. Check if extension is activated (green badge)
2. Verify token is valid
3. Refresh the social media page
4. Check browser console for errors

### Save Button Not Appearing

1. Refresh the page
2. Check if platform is supported
3. Verify extension is active
4. Try disabling/re-enabling extension

### Token Issues

1. Generate a new token from dashboard
2. Paste new token in extension
3. Click "Activate Extension"
4. Refresh social media pages

## Development

### Project Structure

```
extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── content.js         # Content script (injected into pages)
├── content.css        # Styles for save button
├── background.js      # Background service worker
└── icons/            # Extension icons
```

### Building

No build step required! The extension runs directly from source.

### Testing

1. Load extension in Chrome
2. Generate test token
3. Visit supported platforms
4. Test save functionality
5. Check dashboard for saved posts

## API Endpoints

The extension communicates with these backend endpoints:

- `POST /api/linkogenei/verify-token` - Verify access token
- `POST /api/linkogenei/save-post` - Save a post
- `GET /api/linkogenei/posts` - Get saved posts
- `GET /api/linkogenei/stats` - Get statistics
- `GET /api/linkogenei/categories` - Get categories

## Requirements

- Chrome browser (version 88+)
- ContentGenie backend running
- MongoDB database
- Valid access token

## Support

For issues or questions:
- Check the troubleshooting section
- Review browser console logs
- Contact support through ContentGenie dashboard

## License

Part of the ContentGenie project.

## Version History

### v1.0.0 (Current)
- Initial release
- Support for Instagram, LinkedIn, Twitter/X, Facebook
- Category management
- Statistics tracking
- Token-based authentication

## Roadmap

- [ ] YouTube support
- [ ] Reddit support
- [ ] Pinterest support
- [ ] Bulk operations
- [ ] Export saved posts
- [ ] Tags and advanced filtering
- [ ] Keyboard shortcuts
- [ ] Dark mode sync with dashboard

---

Made with ❤️ by the ContentGenie team
