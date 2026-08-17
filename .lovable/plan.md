# SEO SEO Optimization for iLingue Relax App

Reduce the text density in the Hero section and emphasize the image slider for the new app.

## Proposed Changes

### Frontend Improvements

#### 1. Hero Section Cleanup (`src/components/Hero.tsx`)
- Remove the redundant "Logo Badge" above the main heading as the user pointed out it looks like "2 titles".
- Simplify the text content:
    - Keep only the main heading "iLingue Relax App".
    - Reduce the subheading to a single line focusing on the "Listen and Repeat" value proposition.
    - Remove the "Feature Pills" (Relaxed learning, Clear method, etc.) to clean up the visual space.
    - Remove the "Trust Indicators" (Rating, Students count) to focus purely on the App launch.
- Adjust the layout to make the background slider more prominent.

#### 2. Visual Polish
- Ensure the gradient overlay on the slider is balanced so that the images are highly visible but the remaining text is still legible.

## Technical Details
- **Component**: `src/components/Hero.tsx`
- **Actions**:
    - Remove lines 133-141 (Logo Badge).
    - Remove lines 173-186 (Feature Pills).
    - Remove lines 202-219 (Trust Indicators).
    - Simplify `heroContent` strings to be more concise.
