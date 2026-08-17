# Plan: Update Refund Policy to 7 Days

Update the refund policy across the application to reflect a 7-day guarantee instead of 30 days, as requested by the user. This involves updating multiple product pages, the FAQ page, the Returns page, and the Terms & Conditions page.

## Proposed Changes

### Product Pages
- **src/pages/ProductSpanishGrammarPatterns.tsx**
    - Change "30 days" to "7 days" in the standard price card.
    - Change "30-Day Money-Back Guarantee" heading and description to "7-Day Money-Back Guarantee".
- **src/pages/ProductSpanish5000Digital.tsx**
    - Change "30-day money-back guarantee" mentions in the pricing section and footer trust strip to "7-day money-back guarantee".
    - Update the FAQ section answer from "30-day money-back guarantee" to "7-day money-back guarantee".
- **src/pages/Product8000.tsx**, **src/pages/Product1000Verbos.tsx**, **src/pages/Product500Preguntas.tsx**
    - These already mention "7 Días" in most places, but I will perform a final verification to ensure consistency.

### Legal and Info Pages
- **src/pages/FAQPage.tsx**
    - Update SEO description and keywords to mention "garantía de 7 días" (already done in some places, will verify all).
- **src/pages/ReturnsPage.tsx**
    - Update "Libros físicos — Amazon (hasta 30 días)" to "7 días" or remove the specific Amazon 30-day mention if it conflicts with the new brand policy. *Note: User said "borra 30 dias", implying a global brand shift.*
    - Update all language variants (ES, EN, FR, PT) to reflect the 7-day limit.
- **src/pages/TermsPage.tsx**
    - Update "Refund Policy & Guarantee" sections for all language variants to remove 30-day mentions and standardize on 7 days for Hotmart and clarify store policy.

### Components
- **src/components/StickyBuyBar.tsx**
    - I noticed a "6-day guarantee" typo or oddity in the code read earlier. I will standardize this to "7-day guarantee".

## Technical Details
- String replacements for "30-day", "30 días", "30 days" with "7-day", "7 días", "7 days".
- Ensure consistency across multilingual translations (ES, EN, FR, PT).

## Validation Plan
- Manual verification of the FAQ page and primary product pages (/products/5-000-spanish-words-with-english-pronunciation-digital).
- Verify the Returns and Terms pages.
