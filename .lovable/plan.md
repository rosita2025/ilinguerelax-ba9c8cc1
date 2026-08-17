# Plan - Restore and Add All Spanish Mastery System Previews

Restore the previously removed preview images and add the new ones to the "Look Inside" section of `src/pages/ProductSpanish5000Digital.tsx`, ensuring all visual materials are available for the user to see.

## User-Facing Changes
- **Expanded "Look Inside" Section**: The preview gallery will now feature all 7 preview images (original 3 + new 4), providing a comprehensive view of the system's content.
- **Complete Visual Tour**: Users can now see the A1-C1 path, vocabulary pages, practical exercises, exam tests, grammar guides, verb tables, and the daily planner.

## Technical Details
- **Unified Preview Array**: Combine the original preview assets (`previewSpanishIndex`, `previewSpanishVocab`, `previewSpanishPhrases`) with the new ones (`examPreviewAsset`, `grammarPreviewAsset`, `verbsPreviewAsset`, `plannerPreviewAsset`) into a single array for the "Look Inside" section.
- **Grid Layout**: Ensure the grid handles the increased number of items gracefully (e.g., `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Bonuses Section**: Verify that the "Bonuses" section continues to show the correct preview images in their respective dialogs.

## Constraints & Considerations
- Maintain the watermark protection on all preview images.
- Ensure captions and titles for each preview card are accurate and descriptive.
