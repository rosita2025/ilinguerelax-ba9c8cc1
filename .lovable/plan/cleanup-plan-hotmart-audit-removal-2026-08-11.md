# Cleanup Plan - Hotmart Audit Removal

The user wants to completely "clean up" everything related to Hotmart Audit, including database tables, Edge Functions, logs, and any remaining code references.

## User Requirements
- Remove `AdminHotmartAudit.tsx` (Already done in previous turn).
- Cleanup related "Cloud AI", logs, SQL editor references, Edge Functions, and database tables.

## Proposed Changes

### 1. Database Cleanup
I will create a new migration to drop the tables and related objects that were exclusively used for Hotmart auditing.
- `public.hotmart_purchases`: Stores raw webhook data from Hotmart.
- `public.abandoned_carts`: Stores abandoned cart data (often populated by Hotmart webhooks).
- Any related triggers or functions (e.g., sync to Brevo if they were specific to these tables).

### 2. Edge Functions Cleanup
I have already deleted `list-hotmart-audit` and `clear-hotmart-audit`. I will check if there are other functions like `hotmart-webhook` that should be removed if we are moving away from Hotmart auditing entirely.

### 3. Frontend Final Cleanup
- Ensure no links remain in `AdminHome.tsx`, `AdminNav.tsx`, or `App.tsx` (Verified in previous turn, but will double-check).
- Check `AdminAnalytics.tsx` for any remaining references.

### 4. Search for "Cloud AI" related cleanups
The user mentioned "cloud ai". This might refer to AI-generated logs or specific AI features linked to auditing. I will search for "AI" related code in the context of Hotmart.

## Technical Details
- **Migration**: `supabase/migrations/20260811000000_cleanup_hotmart_audit.sql`
  ```sql
  DROP TABLE IF EXISTS public.hotmart_purchases CASCADE;
  DROP TABLE IF EXISTS public.abandoned_carts CASCADE;
  ```
- **Edge Functions**: Verify if `hotmart-webhook` is still needed for other purposes or if it should be removed.

## Verification Plan
- Run `ls src/pages/AdminHotmartAudit.tsx` to ensure it's gone.
- Run `rg "hotmart_purchases" .` to find remaining database references.
- Run `rg "abandoned_carts" .` to find remaining database references.
