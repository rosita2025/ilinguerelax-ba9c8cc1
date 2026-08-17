# Plan: Update Brevo Sync and Monitoring

The user has confirmed that Brevo has been paid. I will verify the current state of the integration and ensure that synchronization is active.

## Proposed Changes

### Backend (Edge Functions)
- Verify `brevo-contact` and `brevo-abandoned-cart` logic to ensure they are processing correctly.
- Check if any queued events in `brevo_sync_logs` or `email_send_log` need re-processing (though they usually process automatically or on next event).

### Monitoring
- Update the memory file `mem://features/brevo-credit-status.md` to reflect that payment has been made.
- Add a new admin dashboard card (if not already present) to show Brevo credit status using the `brevo-account-stats` edge function.

## Technical details
- Use `supabase--edge_function_logs` to monitor `brevo-webhook` for successful deliveries.
- Query `brevo_sync_logs` to ensure new contacts and abandoned carts are being pushed to Brevo lists.
- Check `Deno.env` (via code inspection if possible) if specific list IDs are still missing as previously noted.

## Verification Plan
- Run a diagnostic sync test using `supabase--curl_edge_functions` to trigger a manual contact sync.
- Check logs for "Insufficient credits" errors; if gone, the fix is verified.
- Confirm `email_send_log` shows new entries with `status='sent'`.
