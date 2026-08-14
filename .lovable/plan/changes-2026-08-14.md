---
name: Pixel Debugger UI Cleanup
description: Removes 'Admin Mode' badge and adds a close button to the Meta Pixel Debugger.
type: feature
---
## Changes

### 1. PixelDebugger Component (`src/components/PixelDebugger.tsx`)
- Add a close button (X icon) to the top right of the debugger window.
- Remove the "Admin Mode" badge.
- Ensure the `isVisible` state can be toggled to false by the user.

## Technical Details
- Use the `X` icon from `lucide-react`.
- Add a click handler to the close button that sets `setIsVisible(false)`.
- Delete lines 82-84 in `src/components/PixelDebugger.tsx`.
