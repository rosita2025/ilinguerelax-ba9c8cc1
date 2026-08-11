# Plan - Investigate and Secure Admin Access

The user reports that the admin password has been changed or compromised ("seguro hackeado"). I need to investigate the authentication system, identify potential vulnerabilities, and provide a way for the user to regain control safely.

## User Review Required

> [!IMPORTANT]
> To help you regain control, I need to know:
> 1. Are you still able to log in to the admin panel?
> 2. Have you noticed any unauthorized changes to your products, blog posts, or settings?
> 3. Do you have access to the email `hola@ilinguerelax.com` (where 2FA codes are sent)?

## Proposed Actions

### 1. Investigation
- **Check Admin Key Configuration**: Verify how the `ADMIN_REVIEW_KEY` is being used in the backend.
- **Review 2FA Logs**: If possible, check if there have been successful 2FA verifications from unusual IP addresses (though logs might be limited).
- **Inspect `AdminGate.tsx` and `admin-2fa`**: Look for logic flaws that could allow bypassing the password or 2FA.

### 2. Security Hardening
- **Reset Admin Key**: Guide the user to update the `ADMIN_REVIEW_KEY` secret immediately.
- **Enforce Strict 2FA**: Ensure no "backdoors" exist and that 2FA is mandatory for all sensitive actions.
- **Audit Recent Activity**: Provide a tool or view in the admin panel (if accessible) to see recent administrative actions.

### 3. Recovery (If Locked Out)
- **Secret Rotation**: Use the `secrets--update_secret` tool to allow the user to set a new `ADMIN_REVIEW_KEY` through the Lovable interface.
- **Verify 2FA Destination**: Confirm that `ADMIN_2FA_EMAIL` is still set correctly.

## Technical Details

- **Current System**:
    - **Password**: Defined by `ADMIN_REVIEW_KEY` secret.
    - **2FA**: 6-digit OTP sent via Resend to the email defined in `ADMIN_2FA_EMAIL` (defaulting to `hola@ilinguerelax.com`).
    - **Session**: Managed via HMAC-signed tokens (`x-admin-2fa` header) with 12h or 7d (trusted device) expiry.
- **Vulnerability Check**:
    - The `AdminGate.tsx` handles client-side state, but the real security is in the Edge Function `admin-2fa` and the `assertAdminCsrf` helper.
    - I will check `supabase/functions/_shared/adminCsrf.ts` to ensure it properly validates the 2FA token on every call.
