---
title: Fix Missing Buyer Information and deduplication in Admin Purchases Dashboard
description: Ensure buyer names, emails, and countries are correctly displayed and synchronized for all payment providers in the admin purchases dashboard.
type: feature
---

## Goals
- Fix missing buyer names in the Admin Purchases dashboard, especially for Hotmart and Stripe transactions.
- Improve deduplication logic in the `list-purchases-status` function to prevent missing records (like HP1413567978).
- Ensure consistent extraction of buyer information (name, email, country) across all payment providers.

## Technical Details
### Backend Optimization (`supabase/functions/list-purchases-status/index.ts`)
- **Enhanced Name Extraction**: Improve the extraction of buyer names from metadata and payloads for all providers.
- **Improved Hotmart Filtering**: Update the `.or()` filter to ensure all Hotmart-related events are captured correctly.
- **Hotmart ID Formatting**: Normalize Hotmart transaction IDs in the dashboard to match the standard format (e.g., HP...).
- **Refined Deduplication**: Update the `dedup` key logic to prevent collisions and ensure specific transactions like `HP1413567978` are correctly identified and displayed.
- **Provider-Specific Fixes**:
  - **Stripe**: Ensure names are pulled from both the top-level `name` field and nested metadata.
  - **Hotmart**: Ensure names and emails are pulled from `buyer_name`/`buyer_email` and nested `buyer` objects.

### Admin Dashboard UI (`src/pages/AdminPurchasesStatus.tsx`)
- **Display Improvements**: Ensure the "Unificado" badge is applied correctly when records are merged.
- **Country Visibility**: Verify that the country badge displays the most accurate location data available in the payload.
- **Search Robustness**: Ensure the search functionality correctly filters by name, email, and transaction ID.

## Impact
- Accurate tracking of all sales and abandoned checkouts.
- Clearer visibility into buyer details for customer support and marketing follow-ups.
- Consistent data presentation regardless of the payment gateway used.
