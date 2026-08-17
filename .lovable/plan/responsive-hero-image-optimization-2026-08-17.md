# Responsive Hero Image Optimization

Adjust the Hero slider images to ensure the full app previews are visible and properly framed on mobile, tablet, and desktop viewports without excessive cropping.

## Proposed Changes

### Frontend Adjustments

#### 1. Hero Image Fitting (`src/components/Hero.tsx`)
- Change the image scaling from `object-cover` to a more flexible approach that ensures the mockups are visible.
- Use `object-contain` for the app preview slides to prevent cropping of the device mockups, especially on mobile and tablet.
- Add a subtle background color or blur to the slider container to fill gaps when `object-contain` is used, maintaining the premium dark aesthetic.
- Adjust the gradient overlay to ensure the "Coming Soon" text and CTA buttons remain legible while allowing the images to shine.

#### 2. Layout Tweaks
- Ensure the Swiper container maintains a consistent aspect ratio or height across devices.
- Center the images within the slides.

## Technical Details
- **File**: `src/components/Hero.tsx`
- **Changes**:
    - Update the `img` class in `SwiperSlide` to `object-contain max-h-[80vh] w-auto mx-auto my-auto`.
    - Adjust the slide container to center content flex-ly.
    - Ensure the background gradient doesn't obscure the mockup details.
