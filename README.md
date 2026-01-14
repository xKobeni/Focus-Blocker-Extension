# AI Focus Blocker - Chrome Extension

This Chrome extension integrates with the AI-Powered Focus Blocker web application to block distracting websites during focus sessions.

## Features

- 🔒 **Smart Website Blocking** - Blocks distracting sites from your backend configuration
- 🎯 **Focus Sessions** - Start and end focus sessions directly from the extension
- 📊 **Distraction Tracking** - Automatically counts blocked attempts
- 🔐 **Secure Authentication** - Syncs with your web app account
- ⚡ **Real-time Sync** - Updates blocked sites list from backend

## Installation

### Step 1: Install the Extension

1. Open Chrome (or any Chromium-based browser like Edge, Brave)
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `extension` folder from this project

### Step 2: Connect to Your Account

1. Click the extension icon in your browser toolbar
2. Click "Login / Register" button
3. Log in to your account on the web app
4. The extension will automatically sync with your account

## How It Works

### Authentication Flow

1. User clicks "Login" in the extension popup
2. Opens the web app login page
3. After successful login, the frontend sends the JWT token to the extension via `postMessage`
4. Extension stores the token and can now communicate with the backend

### Blocking Flow

1. User starts a focus session from the extension or web app
2. Extension fetches the list of blocked sites from the backend
3. When user tries to visit a blocked site, they're redirected to a block page
4. Extension tracks the number of distraction attempts
5. When session ends, distraction count is sent to the backend

## Folder Structure

The extension is organized into a clean folder structure:

```
extension/
├── manifest.json           # Extension configuration
├── README.md              # This file
├── AUTO_SYNC_GUIDE.md     # Auto-sync documentation
├── FOLDER_STRUCTURE.md    # Detailed structure guide
├── src/                   # JavaScript source files
│   ├── config.js         # API configuration
│   ├── utils.js          # Utility functions
│   ├── api.js            # Backend API calls
│   ├── popup.js          # Popup logic
│   ├── background.js     # Background service worker
│   └── content.js        # Content script
├── pages/                 # HTML pages
│   ├── popup.html        # Popup interface
│   ├── blocked.html      # Block page
│   └── auth-bridge.html  # Auth bridge page
├── styles/                # Stylesheets
│   └── popup.css         # Popup styles
└── assets/                # Icons and images
    └── (ready for icons)
```

See `FOLDER_STRUCTURE.md` for detailed documentation.

## API Endpoints Used

The extension communicates with these backend endpoints:

- `POST /api/focus-sessions` - Create new focus session
- `POST /api/focus-sessions/:id/end` - End focus session
- `GET /api/blocked-sites` - Get user's blocked sites
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/verify` - Verify token validity

## Configuration

Update `config.js` if your backend is running on a different URL:

```javascript
const API_BASE_URL = "http://localhost:5000/api";
const FRONTEND_URL = "http://localhost:5173";
```

## Troubleshooting

### Extension not receiving token after login

1. Check browser console for errors
2. Make sure both extension and frontend are loaded
3. Try using Incognito mode and reload the extension

### Sites not being blocked

1. Make sure you've started a focus session
2. Check that blocked sites are configured in the web app
3. Look at the extension's background service worker console:
   - Go to `chrome://extensions/`
   - Find "AI Focus Blocker"
   - Click "service worker" under "Inspect views"

### Token expired or invalid

1. Click the extension popup
2. Click "Logout"
3. Log in again through the extension

## Development

### Testing

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the AI Focus Blocker card
4. Test your changes

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Background**: `chrome://extensions/` → Click "service worker"
- **Content Script**: Open DevTools on any webpage, check Console

## Security Notes

- Tokens are stored in `chrome.storage.local` (encrypted by Chrome)
- All API calls use Bearer token authentication
- Extension only runs when explicitly activated
- No data is collected or sent to third parties

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave
- ✅ Opera
- ❌ Firefox (uses Manifest V2)
- ❌ Safari (different extension format)

## Support

If you encounter issues, check:
1. Browser console errors
2. Extension service worker logs
3. Backend server logs
4. Network requests in DevTools

## License

Part of the AI-Powered Focus Blocker project.
