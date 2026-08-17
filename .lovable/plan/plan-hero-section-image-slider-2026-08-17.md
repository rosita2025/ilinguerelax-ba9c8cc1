# Plan - Hero Section Image Slider

The goal is to update the Hero section on the homepage to replace the static background with a slider featuring the two newly uploaded app preview images. This will emphasize the "iLingue Relax App" launch as requested.

## Technical Details

- **Components**: Modify `src/components/Hero.tsx` to integrate `Swiper` for the background slider.
- **Assets**: Use the registered assets `src/assets/app-preview-1.png.asset.json` and `src/assets/app-preview-2.png.asset.json`.
- **Styling**: 
    - Ensure the slider takes the full background area.
    - Maintain the existing gradient overlays for text readability.
    - Implement autoplay and crossfade transitions for a premium feel.
- **Dependencies**: Use `swiper` (already installed).

## Proposed Changes

### `src/components/Hero.tsx`
- Import `Swiper`, `SwiperSlide` from `swiper/react` and necessary modules (`Autoplay`, `EffectFade`, `Navigation`, `Pagination`).
- Import the new image assets.
- Replace the static `<img>` tag (lines 79-89) with a `<Swiper>` component.
- Add two `<SwiperSlide>` elements containing the preview images.
- Adjust the text overlay to ensure it remains centered and legible over the dynamic background.

## User Review Required

> [!IMPORTANT]
> The images provided have different aspect ratios (one is a full promotional banner, the other looks like a book/page preview). I will use `object-cover` to ensure they fill the background, which might crop edges on certain screen sizes. I will also keep the dark gradient to ensure the white text remains legible.
