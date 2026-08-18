# Plan: Update Korean Product Routing and Page Content

The user reported that the page at `https://ilinguerelax.com/products/1-000-palabras-esenciales-para-aprender-coreano` is not updated. I've already identified that this specific URL was missing from the routes, although a similar one (`/products/100-mapas-mentales-para-aprender-coreano-hangul-c1`) exists.

## Proposed Changes

### 1. Routing Update
- **File:** `src/App.tsx`
- **Action:** Add a route for `/products/1-000-palabras-esenciales-para-aprender-coreano` that points to `ProductCoreanoRelax`. (Already initiated in the same turn).

### 2. Product Page Content Update
- **File:** `src/pages/ProductCoreanoRelax.tsx`
- **Action:**
    - Ensure the canonical URL matches the new preferred URL.
    - Double-check that all mentions of "100 Mapas Mentales" are properly removed from the main product name/description and moved to the upsell logic as per the previous plan.
    - Update the SEO metadata to reflect "1,000 Palabras Esenciales" as the primary focus.

### 3. Component Updates
- **File:** `src/components/coreano/CoreanoHeroRedesign.tsx`
- **Action:** Ensure the hero title and benefits exclusively focus on "1,000 Palabras" without mentioning maps as included.

## Technical Details
- Using `line_replace` to add the missing route in `App.tsx`.
- Synchronizing SEO `canonicalUrl` in `ProductCoreanoRelax.tsx`.

## Verification Plan
- Navigate to `http://localhost:8080/products/1-000-palabras-esenciales-para-aprender-coreano` to confirm it loads.
- Verify that the title and content on that page are consistent with the "1,000 Palabras" product focus.
