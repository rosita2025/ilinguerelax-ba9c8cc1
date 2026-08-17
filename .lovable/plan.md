# Plan - Troubleshoot Brevo Sync

The user reports that Brevo contact synchronization is not working as expected. My investigation shows that while there are success logs from a few days ago, the sync appears to have stopped recently or is missing for new events.

## Technical Details

1. **Test Sync Flow:** I will create a test script to trigger the `upsertBrevoContact` function directly to see if it fails with current environment variables.
2. **Check for API Key Issues:** Verify if `BREVO_API_KEY` or `LOVABLE_API_KEY` are still valid by attempting a simple contact lookup or upsert via the gateway.
3. **Verify Webhook Connectivity:** Ensure that external sources (like Hotmart) or internal triggers (like newsletter signups) are correctly calling the sync logic.
4. **Fix Potential Regressions:**
   - Review `supabase/functions/_shared/brevoContact.ts` for any logic that might be skipping syncs silently.
   - Check if recent changes to `email_contacts` table structure (like the `language` or `metadata` fields) are causing issues.

## User Review Required

> [!IMPORTANT]
> I will run a diagnostic test to see why the sync is not happening. You might see a test log in your admin panel for `test_sync@ilinguerelax.com`.
