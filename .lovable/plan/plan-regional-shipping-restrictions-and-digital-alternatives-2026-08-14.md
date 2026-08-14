# Plan: Regional Shipping Restrictions and Digital Alternatives

Implement a logic to inform users in regions where physical shipping is unavailable (like Asia) and suggest the digital version as an alternative.

## User Review Required

> [!IMPORTANT]
> - We will NOT allow physical book purchases in Asia.
> - The user will be informed that shipping is unavailable and suggested to buy the digital version instead.
> - The button to switch to digital will NOT be automatic (as per user preference "Inform only").

## Proposed Changes

### Internationalization (i18n)
- Update `src/i18n/checkoutUI.ts` to include a new string `digitalAlternativeSuggest` in all supported languages (ES, EN, PT, FR).
  - ES: "Considera comprar la versión digital disponible para todo el mundo."
  - EN: "Consider purchasing the digital version available worldwide."
  - PT: "Considere comprar a versão digital disponível para todo o mundo."
  - FR: "Pensez à acheter la version numérique disponible dans le monde entier."

### Checkout Components
#### `OrderSummary.tsx`
- Update the Asia shipping notice to include the suggestion for the digital version.
- Ensure the notice is highly visible when a physical product is in the cart and the detected country is in Asia.

#### `PaymentMethodsGroup.tsx`
- Refine the validation in `handleBuyNow` to not only toast but also explicitly block any payment attempt if Asia + Physical items are detected.
- Add a specific error message in the payment methods area when this condition is met.

## Technical Details
- Detected Asia countries: `["CN", "JP", "KR", "IN", "SG", "MY", "TH", "VN", "PH", "ID"]`.
- The logic will use the existing `region.country` detection from `useRegionTier`.
- We will use the `t.shippingNoticeAsia` and the new `t.digitalAlternativeSuggest` strings.
