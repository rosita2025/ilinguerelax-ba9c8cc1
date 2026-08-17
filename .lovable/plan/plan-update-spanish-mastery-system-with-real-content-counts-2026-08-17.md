# Plan - Update Spanish Mastery System with Real Content Counts and Previews

Update `src/pages/ProductSpanish5000Digital.tsx` to reflect the correct product counts (1,000 verbs and 500 questions) and include the new preview assets, emphasizing "English Pronunciation" and "Latin American Spanish" as requested.

## User-Facing Changes
- **Refined Counts**: Update all mentions to "1,000 Essential Verbs" and "500 Practice Questions".
- **Pronunciation Focus**: Add "with English Pronunciation" to the descriptions of verbs and questions.
- **New Gallery Item**: Add a real preview of the "500 Spanish Questions" to the "Look Inside" section.
- **Latin Spanish Context**: Clarify that the system focuses on Latin American Spanish ("Spanish Latin").

## Technical Details
- **Asset Integration**: Import `questionsPreviewAsset` and `verbsV2PreviewAsset`.
- **Text Updates**:
    - Update the `features` constant.
    - Update the `bonuses` constant (specifically Bonus #3).
    - Update the `Look Inside` grid array.
    - Update the `What's Included` list in the JSX.
- **SEO & Hero**: Ensure the "Latin American Spanish" focus is mentioned where appropriate.

## Constraints & Considerations
- Use "500 Questions" (confirmed by user) instead of the "5,000" typo in the request.
- Ensure the "English Pronunciation" branding is consistent across all product components.
