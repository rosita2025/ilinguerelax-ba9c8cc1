// Shopify variants that must NEVER appear in the cart or reach checkout.
// These are phantom / deprecated Shopify listings that now sell exclusively
// through the internal /checkouts flow (or have been permanently removed).
//
// Add a new entry here (with a comment) whenever a Shopify product is retired
// so both the CartDrawer and cartStore can defensively block it.
export const BLOCKED_VARIANTS: ReadonlySet<string> = new Set<string>([
  "gid://shopify/ProductVariant/43120267100221", // Spanish Relax - 1,000 Verbs in Spanish (deprecated; use /checkouts/1000-verbos)
]);

export const isBlockedVariant = (variantId: string | null | undefined): boolean =>
  !!variantId && BLOCKED_VARIANTS.has(variantId);
