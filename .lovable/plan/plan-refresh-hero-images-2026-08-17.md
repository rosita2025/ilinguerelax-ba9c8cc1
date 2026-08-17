# Plan - Refresh Hero Images

The user is reporting that the hero image (cell phone mockup) hasn't updated despite previous attempts. I will check the asset registry to ensure the latest images are properly referenced and refresh the component state to force the update.

## Technical Details

- Verify if `app-preview-1.png` and `app-preview-2.png` are the correct assets from the latest uploads.
- Update `src/components/Hero.tsx` to ensure the `object-contain` and `h-full` properties are correctly applied to show the mobile mockups as intended.
- Trigger a rebuild/refresh to ensure the preview reflects the latest assets.

## User Review Required

> [!IMPORTANT]
> The app is configured to show a slider with two images. If you only see one or if they look old, please let me know.
