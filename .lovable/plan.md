# Plan - Global Performance and Reliability Optimization

The user requested a thorough review to ensure all products are error-free and that the site avoids loading delays or technical errors. This plan focuses on improving perceived performance through skeleton loaders, enhancing stability in key user paths (Checkout, Product pages), and ensuring no technical regressions exist across the catalog.

## User Review Required

> [!IMPORTANT]
> I will implement skeleton loaders on product and checkout pages to prevent layout shifts and improve the user experience during loading. I will also verify that all pricing and regional logic is error-free across the entire store.

## Technical Details

- **Skeleton Loaders**: Replace empty background states in `ProductDynamic.tsx` and `Checkout.tsx` with themed `Skeleton` components from shadcn to improve perceived performance.
- **Error Gating**: Add error boundaries or safe fallback states to `Products.tsx` and `Languages.tsx` to handle potential API/Supabase failures gracefully without crashing the whole view.
- **Pricing Sync**: Conduct a final check on `useCardPrice` and `useLocalCurrency` to ensure they handle edge cases (e.g., missing currency rates) without technical errors.
- **Visual Edits**: The user request included a no-op visual edit (changing an invisible separator to itself). I will acknowledge this as consistent while focusing on the substantive performance improvements requested.

## Implementation Steps

### 1. Enhanced Loading States
- Update `src/pages/ProductDynamic.tsx` to use a skeleton layout for the hero, image, and pricing area while loading.
- Update `src/pages/Checkout.tsx` to show a skeleton for the order summary and payment methods while the regional tier is being detected.

### 2. Robustness Improvements
- Add defensive checks in `src/pages/Products.tsx` to handle cases where the merged catalog might have missing metadata.
- Ensure `src/components/Languages.tsx` handles the `activeTab` transition smoothly without layout jumps.

### 3. Validation
- Run Playwright tests on the catalog and multiple product slugs to ensure no console errors occur during navigation.
- Verify that `npm run build` passes with the new skeleton integrations.
