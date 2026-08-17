# Minimalist Hero Slider Implementation

Remove all text overlays, headings, and CTA buttons from the Hero section to focus exclusively on the image slider.

## Proposed Changes

### Frontend Simplification

#### 1. Hero Content Removal (`src/components/Hero.tsx`)
- Delete the entire "Content" div (headings, subheadings, and buttons).
- Remove the floating decorative elements and gradients that were intended to enhance text legibility.
- Remove language-specific content definitions and unused imports (`lucide-react`, `Button`, `Link`, etc.).
- Ensure the slider takes up the full viewport and remains visually balanced.

#### 2. Visual Polish
- Maintain the `Swiper` functionality (autoplay, pagination, navigation).
- Keep the centered, contained image layout to ensure full app previews are visible.

## Technical Details
- **File**: `src/components/Hero.tsx`
- **Actions**:
    - Remove imports: `ArrowRight`, `Play`, `Button`, `Link`, `useI18n`.
    - Remove `heroContent` object.
    - Remove lines 96-101 (overlay and floating elements).
    - Remove lines 102-148 (text content and buttons).
    - Update `section` to be a pure container for the `Background Slider`.
