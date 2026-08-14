---
name: COP Exchange Rate Adjustment
description: Updates the USD to COP exchange rate to 4100 to align with market values and fix perceived high prices in Colombia.
type: preference
---

## Changes

### 1. Frontend Exchange Rates (`src/i18n/index.ts`)
- Update `COP` exchange rate from `3950` to `4100`.

### 2. Edge Function Exchange Rates (`supabase/functions/_shared/fxRates.ts`)
- Update `COP` exchange rate from `3950` to `4100` to maintain authoritative server-side parity.

## Impact
- A 106,700 COP price at 3950 rate = $27.01 USD.
- A 106,700 COP price at 4100 rate = $26.02 USD.
- This reduces the perceived USD cost for Colombian customers, addressing the user's concern that the exchange is "too expensive".
