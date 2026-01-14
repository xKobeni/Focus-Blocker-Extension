# Assets Folder

This folder is for extension icons and images.

## Recommended Icons

To make your extension look professional, add these icon files:

### Required for Chrome Web Store:
- **icon16.png** - 16x16 pixels (toolbar icon)
- **icon48.png** - 48x48 pixels (extension management page)
- **icon128.png** - 128x128 pixels (Chrome Web Store)

### Optional:
- **icon32.png** - 32x32 pixels (retina toolbar)
- **icon64.png** - 64x64 pixels (retina extension page)

## Icon Design Tips

1. **Simple and recognizable** - Should be clear at small sizes
2. **Use brand colors** - Purple/blue gradient (#667eea to #764ba2)
3. **Meaningful symbol** - Consider: 🎯 target, 🔒 lock, or ⏱️ timer icon
4. **Transparent background** - Use PNG format with transparency
5. **High contrast** - Ensure visibility on light and dark backgrounds

## How to Add Icons

1. Create icon files (or use a design tool like Figma, Canva)
2. Save them in this `assets` folder
3. Update `manifest.json`:

```json
{
  "action": {
    "default_popup": "pages/popup.html",
    "default_icon": {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  },
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
}
```

## Quick Icon Generation

You can use these tools to generate icons quickly:
- **Figma** - Free design tool
- **Canva** - Easy icon creation
- **Icon Generator websites** - Search "Chrome extension icon generator"
- **AI tools** - DALL-E, Midjourney for unique icons

## Temporary Solution

Until you add custom icons, Chrome will use a default icon. The extension will work fine without custom icons, but they make it look more professional!
