# Plan: Automatic Pricing and Ad Sync for New Products

Ensure that new products automatically receive optimized regional pricing and SEO/Ad metadata upon creation, maintaining consistency with existing admin and catalog logic.

## Technical Details

### 1. Pricing Automation
- **Base USD Anchor**: When a new product is created, the system will calculate suggested regional prices (`local_prices`) and regional USD values (`local_usd_prices`) based on the base USD price.
- **PEN Priority**: Automatically set the Peruvian Soles (PEN) price using the internal 3.75 rate if not manually specified.
- **LatAm Multiplier**: Apply regional multipliers (typically 2.5x base for display, but configurable) to generated suggestions.

### 2. Admin Interface Updates (`AdminProductEdit.tsx`)
- **Auto-populate pricing**: Trigger a calculation for all 30+ supported currencies when `price_usd` is changed for a "new" product.
- **Ad Metadata Defaults**: Pre-fill gallery SEO titles and keywords based on the product name and target language (e.g., "Vista previa - Aprender Inglés").
- **Draft Persistence**: Ensure automatic pricing triggers don't overwrite manual edits if a draft is restored.

### 3. Backend Synchronization (`manage-products` Edge Function)
- **Validation**: Ensure that `local_prices` and `local_usd_prices` are correctly rounded and stored as valid JSON.
- **Indexing**: Trigger Google Indexing and Pinterest catalog pings immediately upon the first "active" save of a new product.

## Components to Update

### Frontend
- `src/pages/AdminProductEdit.tsx`: Add logic to `useEffect` that listens for `price_usd` changes on new products to populate `local_prices` and `local_usd_prices` suggestions.
- `src/pages/AdminProducts.tsx`: (Optional) Add a "Quick Clone" or "Duplicate" feature to inherit pricing structures from existing products.

### Backend
- `supabase/functions/manage-products/index.ts`: Reinforce the `upsert` logic to handle automatic rounding of regional overrides.

## User Review Required
> [!IMPORTANT]
> The automatic pricing uses the store's internal exchange rates (e.g., 1 USD = 3.75 PEN, 1 USD = 20.5 MXN). Do you want these rates to be strictly fixed, or should they pull from a live external API daily?
