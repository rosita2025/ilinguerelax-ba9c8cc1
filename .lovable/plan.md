# Plan - Product SKU `npca` Optimization

Optimize the product page for the Korean ebook (SKU `npca`) by removing the physical book review image, updating the FAQ with specific digital delivery and payment terms, and ensuring all content reflects the "iLingue Relax" brand.

## User Review
- Remove the image of the woman reading a physical book (Spanish Relax) from the `npca` product page (it's a digital product).
- Update FAQ for SKU `npca`:
    - Delivery time: Sent within 5 minutes.
    - Format: High-quality Digital PDF (Official iLingue Relax Brand).
    - Payment methods: Stripe, Cards, PayPal.
    - Guarantee: 7-day money-back (50% partial refund if already downloaded).
- Ensure "iLingue Relax" branding is consistent.

## Technical Details
- **File**: `src/pages/ProductDynamic.tsx`
- **Action**:
    - Add a conditional check or update the existing FAQ items for SKU `2-000-palabras-esenciales-para-aprender-coreano-hangul-pronunciacion-para-hispanohablantes-npca`.
    - Investigate why the physical book review image is appearing on the `npca` page (likely part of the `ResenasWhatsAppCoreano` or a global review component) and remove/replace it with a digital-appropriate one or ensure it's filtered out for this SKU.
    - *Note*: Looking at `ResenasWhatsAppCoreano.tsx`, the images used are `r1`, `r2`, `r3` which seem to be screenshots. The user's uploaded image `image-321.png` shows a red "X" over a testimonial section titled "What our customers are saying" with a woman holding a physical "Spanish Relax" book. This is likely in `ResenasWhatsAppCoreano.tsx` or `LooxStyleReviews`.
    - Wait, the user says "borra el testimnios de la mujer con libronorra". In the screenshot `image-321.png`, it's the `ResenasWhatsAppCoreano` section (indicated by "What our verified buyers are saying" and the WhatsApp badges).
    - I will update `ResenasWhatsAppCoreano.tsx` to ensure that for the Korean product, it doesn't show physical Spanish book photos if any are hardcoded or if the user wants to remove that specific slide.

## Validation Plan
- Check the preview for SKU `npca`.
- Verify the FAQ content matches the request.
- Confirm the physical book review image is gone.
