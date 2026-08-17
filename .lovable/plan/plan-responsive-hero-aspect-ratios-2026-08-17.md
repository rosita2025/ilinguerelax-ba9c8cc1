# Plan - Responsive Hero Aspect Ratios

The user wants the hero section to have specific aspect ratios: 16:9 on computer and 9:19 on mobile. I will update the Hero component to use these ratios and ensure the latest uploaded images are correctly displayed.

## Technical Details

- Register the latest uploads (`7895...-2.png` and `6077...-2.png`) as the primary hero assets.
- Update `src/components/Hero.tsx` to apply responsive aspect ratios:
  - **Mobile:** Set the container to a 9:19 aspect ratio (or similar tall ratio) to match modern phone screens.
  - **Desktop:** Set the container to a 16:9 aspect ratio (`aspect-video`).
- Use `object-cover` to ensure the images fill these specific ratios gracefully.
- Maintain the Swiper slider functionality without text overlays as previously requested.

## User Review Required

> [!IMPORTANT]
> Since the provided images are square, using specific ratios like 9:19 and 16:9 will cause some cropping to fill the area. I will center the images to keep the mockups visible.
