# Plan - Restrict Meta Pixel Debugger Visibility

The goal is to prevent the Meta Pixel Debugger from appearing automatically for admins on the production site. It should only be visible in development environments (localhost or Lovable preview) or when explicitly requested via a URL parameter.

## Proposed Changes

### Frontend - `src/components/PixelDebugger.tsx`
- Update the visibility logic to ignore the admin key for automatic display.
- Limit automatic display to development environments (`localhost` or `lovable.app`).
- Keep the `pixel_debug=1` URL parameter as a manual override for production debugging.

## Technical Details
- Change visibility condition from `(isAdmin || isDebug)` to `(isDebug || isDevEnvironment)`.
- Define `isDevEnvironment` as `window.location.hostname.includes('localhost') || window.location.hostname.includes('lovable.app')`.
- This ensures the debugger doesn't pop up for the user on their live production domain `ilinguerelax.com` even if they have an admin session active.
