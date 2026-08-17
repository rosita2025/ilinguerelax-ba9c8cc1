# Plan: Product Page UI and Copy Synchronization

Synchronize the "Spanish Mastery System" product page with the latest branding requirements and provided visual evidence.

## User Review Required

> [!IMPORTANT]
> - The user requested "borra todoo, poruqe ya tenemos la previa vista" (delete everything because we already have the preview). I interpret this as removing the redundant placeholder text/visuals in the "Look Inside" or "Bonuses" section while keeping the actual real preview images we just added.
> - I will ensure the "EVERYTHING INCLUDED" and "Added to your download at no extra cost" labels match the provided screenshot (`image-299.png`).

## Proposed Changes

### Frontend Improvements

#### `src/pages/ProductSpanish5000Digital.tsx`
- Update the **Bonuses Section** header to exactly match the provided image (`image-299.png`).
  - Change badge to "EVERYTHING INCLUDED".
  - Change heading to "Added to your download at no extra cost".
- Clean up the "Look Inside" section to remove generic placeholders and focus on the real preview assets.
- Ensure the "Everything Included" messaging is consistent throughout the page.

## Technical Details

- **Component**: `ProductSpanish5000Digital`
- **Text Updates**:
  - `EVERYTHING INCLUDED` badge (line 527)
  - `Added to your download at no extra cost` heading (line 529)
- **Asset Cleanup**: Verify that the gallery only uses the 8 high-quality preview assets defined in lines 446-486, ensuring no generic fallback blocks remain.

## Validation Plan

- Verify the visual hierarchy in the Bonuses section matches the screenshot.
- Check that the "Look Inside" section renders all 8 real preview images correctly.
- Verify that no "generic" placeholders or technical descriptions are visible in the sample dialogs.
