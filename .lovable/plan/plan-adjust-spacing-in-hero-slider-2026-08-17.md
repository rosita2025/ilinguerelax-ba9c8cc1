# Plan - Adjust spacing in Hero slider

The user wants to "adjust more space at the top" (ajustar mas espacio arriba) in the Hero section, which currently consists only of a Swiper slider with app previews. Based on the provided image `image-311.png`, there are red marks indicating the top and bottom spacing around the image slider.

## Technical Details

- Modify `src/components/Hero.tsx` to add vertical padding or margin to the `section` or the `SwiperSlide` container.
- Currently, the slider uses `items-center` which centers the image vertically.
- I will add a top padding (e.g., `pt-20` or `pt-32`) to push the images down and create the requested "space at the top".

## Changes

### Frontend

- **src/components/Hero.tsx**:
    - Update the section class to include `pt-20 md:pt-32` (or similar) to ensure there is visible space above the slider images, especially since the header might be overlapping or it just looks too tight.
    - Alternatively, adjust the slide container to have top padding instead of being strictly centered.
