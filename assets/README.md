# Assets Directory

This directory contains the app's assets (icons, images, etc.).

## Required Assets

Based on `app.json`, the following assets are required:

1. **icon.png** (1024x1024) - App icon
2. **splash.png** (1284x2778 recommended) - Splash screen image
3. **adaptive-icon.png** (1024x1024) - Android adaptive icon
4. **favicon.png** (48x48 or 32x32) - Web favicon and logo mark (use the Tankua paper boat asset for all website icons and logo representations). Copied to `web/apps/*/public/` for Next.js apps.
5. **notification-icon.png** (96x96) - Notification icon

## Generating Placeholder Assets

Run the following command to generate placeholder assets:

```bash
node scripts/generate-assets.js
```

Or manually create/download these images and place them in this directory.

