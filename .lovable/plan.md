# Plan: Aligns WhatsApp and Scroll-to-Top Floating Buttons

The user wants to align the floating WhatsApp and Scroll-to-Top buttons in a single horizontal row, positioned consistently above the `StickyBuyBar`.

## User Preferences
- **Alignment:** Same horizontal row.
- **Position:** `bottom-[105px]` (above the sticky bar).
- **Size:** Compact and uniform (`w-10 h-10` or `w-11 h-11`).
- **Layout:** Option B (Extremos opuestos alineados) — WhatsApp at `left-4`, Scroll-To-Top at `right-4`.

## Technical Details
- **Current state:** `WhatsAppButton` and `ScrollToTop` have independent positioning logic using a CSS variable `--sticky-bar-h`.
- **Target:** Standardize the `bottom` offset and size in both components.
- **Responsiveness:** Ensure the buttons remain elegant and compact on mobile.

## Steps
1. **Modify `src/components/WhatsAppButton.tsx`:**
   - Update `bottom` positioning to use `105px` offset from the sticky bar base.
   - Set position to `left-4`.
   - Standardize icon container size to `w-11 h-11`.
2. **Modify `src/components/ScrollToTop.tsx`:**
   - Update `bottom` positioning to use `105px` offset from the sticky bar base.
   - Ensure position is `right-4`.
   - Standardize button size to `w-11 h-11`.
3. **Verification:**
   - Check multiple product pages (e.g., `ProductSpanish5000.tsx`) where both buttons are used.
   - Verify alignment in the preview.
