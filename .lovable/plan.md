# Plan: TikTok Access Token and Sticky Bar Event Tracking

The user wants to add a TikTok access token (`fdee6ecfda5f12c5a9b485e536e8c442f9815ddf`) to the project and update the `StickyBuyBar` component to trigger TikTok events (ViewContent, AddToCart, InitiateCheckout) when interacted with.

## User Review Required

> [!IMPORTANT]
> - The TikTok Access Token will be stored securely as a secret (`TIKTOK_ACCESS_TOKEN`) for use in server-side reporting (Conversions API).
> - Events will be tracked in the browser using the existing TikTok Pixel script.

## Proposed Changes

### Backend (Supabase)

#### Secrets
- Add `TIKTOK_ACCESS_TOKEN` with the value provided by the user.

#### Edge Functions
- Update `meta-capi-event` (or create a new specialized TikTok function) to also forward events to the TikTok Conversions API using the new access token.

### Frontend

#### Tracking Hook (`src/hooks/useMetaPixel.ts`)
- Add a helper `trackTiktokEvent` that uses `window.ttq` to track standard events (`ViewContent`, `AddToCart`, `InitiateCheckout`).
- Ensure it respects the same consent and internal traffic rules as the Meta Pixel.

#### Sticky Buy Bar (`src/components/StickyBuyBar.tsx`)
- Trigger TikTok events on relevant interactions:
  - `ViewContent` when the bar is rendered.
  - `AddToCart` when the primary CTA is clicked (if leading to internal checkout).
  - `InitiateCheckout` (or follow the user's "continuar de pago" phrasing) when navigating to the checkout page.

### Technical Details
- Access Token: `fdee6ecfda5f12c5a9b485e536e8c442f9815ddf`
- TikTok Pixel ID (already in code): `DA38RORC77UFIU51BH10`
- Browser Events: `ttq.track('ViewContent')`, `ttq.track('AddToCart')`, etc.
