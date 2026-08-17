# Plan: Update Physical Product Price and Remove Bonuses

The user wants to update the price of the physical product (Spanish Mastery System) to $22 and remove references to the "3 bonuses" from the physical product page.

## Changes

### `src/pages/ProductSpanish5000.tsx` (Physical Product Page)
- Update the base price from $44.00 to $22.
- Remove all mentions of "3 bonuses" (text and sections).
- Update the "3 exclusive bonuses" bullet point.
- Remove the "Bonuses" section entirely.
- Update the FAQ answers to reflect the removal of bonuses.

### `src/pages/ProductComparisonSpanish.tsx` (Comparison Page)
- Update the Physical + Digital Bundle price to $22.
- Remove the "3 Exclusive Bonuses" feature from the Physical bundle card.

### `src/pages/ProductSpanish5000Digital.tsx` (Digital Product Page)
- Update the "Upgrade to Physical" price reference to $22 if present (checking file).

## Technical Details
- Standardizing the physical product price across all pages.
- Ensuring the SEO metadata also reflects the new price.

## User Review Required
> [!IMPORTANT]
> The price is being changed from $44 to $22 for the physical product. References to the 3 bonuses are being removed from the physical product flow as requested.
