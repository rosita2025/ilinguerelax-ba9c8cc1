# Plan: Fix Product Draft Restoration

The "Restore Draft" feature in the Admin Product Edit page is currently failing because the auto-save logic overwrites the valid draft with empty default data before the user has a chance to restore it.

## Problem Analysis
1.  **Race Condition**: When entering the "New Product" page, `loading` is initially `true`. Once the component mounts and initial data (defaults) is set, `loading` becomes `false`.
2.  **Premature Auto-Save**: The auto-save `useEffect` has a 2-second timer that starts as soon as `loading` is `false`.
3.  **Overwrite**: If the user doesn't click "Restore" within 2 seconds, the auto-save logic stringifies the current (empty) state and saves it to `localStorage`, overwriting the real draft the user wanted to recover.

## Proposed Changes

### `src/pages/AdminProductEdit.tsx`
- **Modify Auto-Save Guard**: Add `hasDraft` to the dependencies and the guard condition in the auto-save `useEffect`. If `hasDraft` is `true`, the auto-save will be disabled until the user handles the draft (restores or discards).
- **Ensure Consistency**: Verify that `setHasDraft(false)` is called in both `restoreDraft` and `discardDraft` (which it already is).

## Verification Plan
1.  **Manual Verification**:
    - Open the "New Product" page.
    - Fill in some data (Title, Price).
    - Close the tab or refresh.
    - Wait more than 2 seconds (to see if the fix prevents the overwrite).
    - Click "Restore".
    - Verify all fields are correctly populated.
2.  **Edge Case**: Verify that after discarding a draft, new changes ARE auto-saved.
3.  **Existing Products**: Verify the logic works similarly when editing existing products (though less critical as existing products load data from the DB first).
