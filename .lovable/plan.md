# Plan: Unify Digital Price in Physical Product Page

The user wants to ensure the "Digital Only" price shown on the physical product page (`/products/5-000-spanish-words-with-english-pronunciation-physical`) matches the unified target price of **$72.99 USD**, using the `useAdminPricing` hook for automatic updates.

## User Review Required

> [!IMPORTANT]
> The price for the Digital Only version will now be **$72.99 USD** (Global/LATAM) and **$280.00 PEN** (Peru), synchronized with the admin dashboard.

- Do you want to keep the "SAVE 55%" badge, or should it be recalculated based on the $97 original price? (It will be ~25% now).

## Technical Details

### 1. Update `src/pages/ProductSpanish5000.tsx`
- Import `useAdminPricing`, `useCountryTierRouting`, and `useI18n`.
- Initialize `useAdminPricing` for the digital SKU: `5-000-spanish-words-with-english-pronunciation-digital`.
- Initialize `useCountryTierRouting` for the digital SKU to handle regional pricing (PEN/USD).
- Replace hardcoded `$34.99` and `$97.00` in the "Digital Only" section (lines 474-481) with dynamic labels from the hooks.
- Update the "SAVE" percentage to be dynamic or reflect the new saving (~25%).

### 2. Verification
- Verify the physical product page on the preview.
- Confirm the "Digital Only" section displays **$72.99** for US users and **S/280.00** for Peru users.
