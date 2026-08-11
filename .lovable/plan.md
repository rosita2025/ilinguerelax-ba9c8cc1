# Plan: Unified Marketing Automation Hub

The user is confused by the multiple email tracks (Newsletter, Post-Purchase, Abandoned Cart). I will create a unified "Marketing Automation Hub" that centralizes all these automations into a single view with tabs, health metrics, and a clear safety checklist.

## User Review Required

> [!IMPORTANT]
> - Do you prefer the name "Centro de Marketing" or "Automatización de Email"?
> - I will group "Abandoned Carts" (Store + Hotmart) into one tab. Does that work for you?

## Technical Details

### 1. Database & Backend
- No schema changes needed (tables `marketing_drip_config`, `newsletter_drip_config`, and `persistent_carts` already exist).
- I will create a helper Edge Function `get-marketing-stats` to aggregate today's sends from all 3 systems (`marketing_drip_sends`, `newsletter_drip_sends`, `brevo_abandoned_logs`).

### 2. Frontend Changes
- **Rename/Move Page**: Rename `src/pages/AdminMarketingDrips.tsx` to `src/pages/AdminMarketingHub.tsx`.
- **Unified UI**:
    - **Tabs**: `Resumen`, `Post-Compra`, `Newsletter`, `Abandonos`.
    - **Health Cards**: Real-time stats for all tracks.
    - **Safety Checklist**: Visual panel explaining the deduplication logic (Max 1 per 24h, Purchase check, etc.).
- **Admin Home & Nav**: Update labels from "Marketing Post-Compra" to "Automatización de Email".

### 3. Safety Logic (Visualized)
I will add a "Safety Dashboard" showing:
- **Global Throttle**: 24h wait between any marketing email.
- **Conversion Check**: Automatic skip if the product is already purchased.
- **Abandoned Check**: 72h hold if the user has an active cart (don't interrupt the checkout flow with newsletters).

## Steps
1. Create `supabase/functions/get-marketing-stats/index.ts` to aggregate cross-table metrics.
2. Create `src/pages/AdminMarketingHub.tsx` with a tabbed interface.
3. Update `src/App.tsx` and `src/components/admin/AdminNav.tsx` to point to the new hub.
4. Update `src/pages/AdminHome.tsx` labels.
5. Verify today's send counts are accurate across all tracks.
