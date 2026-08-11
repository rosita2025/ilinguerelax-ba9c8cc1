# Plan: Mobile Optimization for Admin Marketing Hub

The user wants to adjust the `admin/marketing-drips` (Marketing Hub) interface to be more mobile-friendly. The hub currently centralizes Newsletter, Post-Purchase (Drips), Abandoned Carts, and Reviews, but some tables and layouts might be hard to read on mobile.

## Proposed Changes

### 1. Unified Mobile Header & Navigation
- Ensure `AdminNav` handles mobile properly (already implemented but will verify).
- Make the main header in `AdminMarketingHub.tsx` stack correctly on small screens.

### 2. Stats Grid Optimization
- Adjust grid layouts in `AdminMarketingHub.tsx` to stack 1-column on mobile and 2-column on tablets.
- Reduce font sizes slightly for mobile to prevent overflow in cards.

### 3. Responsive Tables
- Wrap all tables in `AdminMarketingDrips.tsx`, `AdminNewsletterDrip.tsx`, `AdminBrevoAbandoned.tsx`, and `AdminReviewInvitations.tsx` with `overflow-x-auto`.
- Use `whitespace-nowrap` on essential columns.
- On very small screens, hide less critical columns or switch to a card-based "list" view for rows.

### 4. Tabs & Content Adjustments
- Ensure the `TabsList` in `AdminMarketingHub.tsx` is scrollable on mobile so it doesn't break the layout.
- Adjust padding in `TabsContent` containers for mobile (`p-0` or `p-2` instead of `p-6`).

### 5. Form Optimization (Newsletter Drip)
- Make the "Test Send" form in `AdminNewsletterDrip.tsx` a single column on mobile.

## Technical Details

### Files to Modify
- `src/pages/AdminMarketingHub.tsx`: Main layout, stats cards, tabs navigation.
- `src/pages/AdminMarketingDrips.tsx`: Post-purchase table and sequence cards.
- `src/pages/AdminNewsletterDrip.tsx`: Test form and drip sends table.
- `src/pages/AdminBrevoAbandoned.tsx`: Abandoned cart log (expandable rows).
- `src/pages/AdminReviewInvitations.tsx`: Review invitation table.

### Approach
- Use Tailwind responsive classes (`sm:`, `md:`, `lg:`).
- Prioritize content hierarchy (most important data visible first).
- Use `lucide-react` icons to save space on mobile where labels might be long.
