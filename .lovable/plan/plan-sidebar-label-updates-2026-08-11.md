# Plan - Sidebar Label Updates

The user wants to update labels in the Admin Sidebar to clarify manual payment types and dLocal Go coverage. Specifically, renaming "Pagos manuales" to include Yape/Plin and changing "dLocal Go · Cobertura" to "dLocal Go · Manual".

## Proposed Changes

### Frontend Implementation

#### Admin Navigation
- Update `src/components/admin/AdminNav.tsx`:
    - Change the label "Pagos manuales" to "Pagos manuales (Yape/Plin)".
    - Change the label "dLocal Go · Cobertura" to "dLocal Go · Manual".

## Technical Details
- Modified file: `src/components/admin/AdminNav.tsx`
- Updates involve changing string literals in the `groups` configuration object.

## Verification Plan

### Manual Verification
- Navigate to the `/admin` dashboard.
- Verify that the sidebar links under the "Ventas" section now display the updated labels.
- Confirm the icons and destinations (`/admin/manual-payments` and `/admin/dlocal`) remain unchanged and functional.
