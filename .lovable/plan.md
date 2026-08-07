# Plan - Fix "Error al guardar drive_url"

The user is reporting an error when saving the `drive_url` in the product editor ("el problema otra vez error al guardar drive url"). This follows a recent change where security guards were added to prevent accidental overwrites of delivery links.

## Diagnosis
1.  **Race Condition/State Mismatch**: In `AdminProductEdit.tsx`, the `save` function handles a specific `409 Conflict` error (`drive_url_change_requires_confirmation`) by re-triggering itself (`return save({ force: false })`). However, the logic that shows the `window.prompt` is *before* the `adminInvoke` call.
2.  **Ambiguous Error Handling**: The `catch` block in `AdminProductEdit.tsx` might not be correctly identifying the `409` response from the Edge Function because `adminInvoke` returns errors in a `{ data, error }` object, but also throws in some cases.
3.  **SKU Confirmation Logic**: If the user is creating a *new* product, `isNew` is true, and `originalDriveUrl` is empty. The current logic `!isNew && originalDriveUrl && newDrive !== originalDriveUrl` correctly skips confirmation for new products, but might fail if `originalDriveUrl` is somehow `undefined` or if the backend rejects it regardless of the frontend's check.
4.  **Backend Constraints**: The backend `manage-products` function has its own `drive_url` consistency check. If the frontend doesn't send `confirmDriveChange: true` when the backend expects it, the save fails with a 409.

## Proposed Changes

### 1. Frontend: Fix `save` Logic Flow
- Simplify the confirmation flow in `AdminProductEdit.tsx`.
- Ensure that if the backend returns `drive_url_change_requires_confirmation`, we correctly prompt the user and retry with the confirmation flag.
- Improve the detection of whether a confirmation is needed by checking if the value actually changed from what's in the database.

### 2. Edge Function: Relax New Product Guard
- Ensure `manage-products` does not require confirmation if the product is being created for the first time or if the previous `drive_url` was null/empty.

### 3. Error Feedback
- Log the full error context in the console to help debug if the prompt still doesn't appear.

## Verification Plan
1. **New Product Test**: Create a new product with a `drive_url` and verify it saves without a prompt.
2. **Edit Product Test (No Change)**: Edit an existing product without changing `drive_url` and verify it saves.
3. **Edit Product Test (Change Link)**: Change the `drive_url` of an existing product, verify the prompt appears, and verify the save succeeds after entering the SKU.
4. **Duplicate Link Test**: Try to use a `drive_url` that already exists on another product and verify the "URL duplicado" toast appears.
