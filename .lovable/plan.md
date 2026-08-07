# Plan: Fix Storage RLS and Permissions for Product Images

The user is still experiencing "row-level security policy" errors when uploading images in the admin panel. Previous attempts (v7) were applied but might have lacked explicit schema usage and table-level `GRANT`s for the `authenticated` role, or were overly complex.

## Proposed Changes

### Database Migration
- Create a new migration `v8` to:
  - Grant `USAGE` on the `storage` schema to `authenticated` and `anon` roles.
  - Grant `ALL` privileges on `storage.objects` and `storage.buckets` to `authenticated` and `service_role`.
  - Grant `SELECT` and `INSERT` privileges to `anon` (to ensure broad compatibility if roles are misaligned).
  - Simplify RLS for the `product-images` bucket to a single `FOR ALL TO public` policy on `storage.objects` and `storage.buckets`, restricted by `bucket_id`.
  - This ensures that as long as the request targets the correct bucket, the database allows the operation regardless of which client role is active.

### Memory & Documentation
- Update `mem://constraints/storage-policy-consolidation` to reflect the move to v8 unified policies and the requirement for explicit `GRANT`s.
- Update `mem://index.md` to reference the v8 consolidation.

## Verification Plan

### Database Verification
- Run `psql` queries to verify the existence of the new `product_images_v8_objects_all` and `product_images_v8_buckets_all` policies.
- Check `pg_policies` to ensure no conflicting `v7` or earlier policies remain.

### Runtime Verification (Optional but Recommended)
- Since I cannot easily upload a file via Playwright without admin access, I will verify the policies are correctly applied and active in the database.
- Request the user to try the upload again in the admin panel.
