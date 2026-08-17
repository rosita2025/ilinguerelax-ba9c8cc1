# Plan - Update Spanish Mastery System Previews and Bonuses

Update `src/pages/ProductSpanish5000Digital.tsx` to include new preview images and ensure all "bonuses" are presented as included components of the system, matching the user's provided screenshots.

## User-Facing Changes
- **New Previews**: The "Look Inside" and "Bonuses" sections will now show real pages from the product (Exam, Daily Planner, Grammar Guide, and Verbs Table).
- **Refined Branding**: Reiterate that specialized resources are "Included at no extra cost" rather than separate add-ons.
- **Enhanced Visuals**: The "See sample" dialogs will now display actual page previews instead of placeholder icons.

## Technical Details
- **Asset Integration**: Import 4 new image assets (`spanish-daily-planner-preview`, `spanish-exam-preview`, `spanish-grammar-preview`, `spanish-verbs-preview`) generated from user uploads.
- **Component Update**: 
    - Modify `BonusPreviewDialog` to accept and display a `previewImage`.
    - Update the `bonuses` data array to include these new preview image references.
    - Update the `Look Inside` section mapping to use the new assets.
- **Layout Consistency**: Ensure the bonus section styling matches the user's provided UI reference (`image-292.png`) while maintaining the current dark/premium aesthetic.

## Constraints & Considerations
- Maintain watermark/overlay protection on preview images (`PREVIEW · ilinguerelax.com`).
- Ensure responsive behavior for the new image previews in dialogs.
