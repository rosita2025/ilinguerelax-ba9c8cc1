---
name: Hero Responsive Optimization
description: Adjust the hero section to show only the images, optimized for mobile without iPad/Desktop padding issues.
type: design
---

# Plan - Hero Responsive Optimization

The goal is to ensure the Hero slider displays correctly on mobile devices without desktop/iPad-specific scaling or padding that might be affecting the mobile experience. The user explicitly stated: "queda colocamos celular hedo, no compu ni ipad debe, se queda no cambia imagenes de computadora y ipad" (roughly: "keep it for mobile, not computer or ipad, don't change computer and ipad images").

## Technical details

- Modify `src/components/Hero.tsx` to further optimize the container for mobile devices.
- Ensure `min-h` values are appropriate for a purely mobile-first visual experience if that's the intention, or ensure the current `object-contain` logic doesn't create unwanted gaps on mobile.
- Remove the `md:min-h-screen` and `md:pt-12` constraints if the user wants to force a specific "mobile-app" look even on larger screens, or simply ensure it's tight.
- Refine the image container to avoid any "desktop" feel (like excessive lateral margins).

## User Review Required

> [!IMPORTANT]
> The current Hero already uses `object-contain` to avoid cropping. I will adjust the layout to be even tighter and ensure it looks like a dedicated mobile app landing regardless of the device.

- **Mobile First**: The slider will occupy the full viewport width on mobile.
- **Minimal Spacing**: Further reducing top padding to ensure the image is the absolute protagonist.
