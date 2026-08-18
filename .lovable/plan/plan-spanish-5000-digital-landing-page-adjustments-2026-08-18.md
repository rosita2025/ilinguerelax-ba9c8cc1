# Plan: Spanish 5000 Digital Landing Page Adjustments

Optimize the landing page to clearly distinguish between current deliverables (PDF, Flashcards, Grammar) and future bonuses (Native Audios, iLingue Relax App) to prevent customer confusion and refund requests.

## User Review
- **Audio/App Status:** If audios/app are in development, label them as "Coming Soon" or "Early Access Bonus".
- **Testimonial Sync:** Remove or update testimonials mentioning audio modules if audios aren't available yet.
- **Offer Structure:** Separate "Included Today" from "Launch Bonuses / Coming Soon".

## Proposed Changes

### `src/pages/ProductSpanish5000Digital.tsx`

#### 1. Update Features & Benefits
- Add "Coming Soon" or "Launch Bonus" labels to `Native Audio Modules` and `iLingue Relax App`.
- Update the `benefits` and `features` arrays to reflect early access status for future updates.

#### 2. Re-sync Testimonials
- Modify the `shortTestimonials` array to remove specific mentions of "audio modules" (e.g., Mark, UK) or update them to reflect expectation of future value.
- Update the featured review box to focus on the English pronunciation system and PDF value.

#### 3. Restructure Offer Checklist
- Split the "What's included" list into two sections:
    - **Included Today (Instant Download):** PDF, Grammar Guide, Verbs, Questions, Flashcards.
    - **Early Access Bonus (Coming Soon):** Native Audio Pack (MP3), Future App Access.

#### 4. Update FAQ
- Clarify in the FAQ that the Audio Pack is a launch bonus that will be sent via email once available.

## Technical Details
- Use a `Badge` or specialized `span` with `bg-amber-100 text-amber-700` for "Coming Soon" labels.
- Ensure the `StickyBuyBar` text remains accurate to what is being sold today.

## Validation Plan
- Verify that "Coming Soon" labels are clearly visible.
- Check that the testimonials no longer make false claims about unavailable features.
- Ensure the distinction between instant deliverables and future bonuses is legally clear to prevent refund disputes.
