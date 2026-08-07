---
name: Google Drive Normalization and Preview
description: Automates Drive URL extraction/normalization and adds a preview iframe to the product editor.
type: feature
---

# Google Drive Enhancement Plan

## 1. Utility Library
Create `src/lib/googleDrive.ts` to handle:
- **ID Extraction**: Supports `/file/d/ID`, `/folders/ID`, `?id=ID`, `open?id=ID`, and `/d/ID/view`.
- **Normalization**: Standardizes all valid links to `https://drive.google.com/file/d/ID/view` (or `/folders/` if it's a folder).
- **Embed URL Generation**: Generates `/preview` links for iframes.

## 2. Preview Component
Create `src/components/admin/GoogleDrivePreview.tsx`:
- A lightweight card that detects if the URL is a Drive link.
- Renders an `iframe` with `loading="lazy"`.
- Provides visual feedback (e.g., "Previewing Drive Content").

## 3. Editor Integration
Update `src/pages/AdminProductEdit.tsx`:
- **Auto-normalization**: When a user pastes a link into `drive_url` or a bonus `drive_url`, automatically extract the ID and re-format the field to the standard clean URL.
- **UI**: Place the `GoogleDrivePreview` component immediately below the URL inputs.
- **Validation**: Improve the existing regex check for Drive links to be more permissive during entry but strict on save.

## 4. Verification
- Verify pasting a messy long Drive URL (with share parameters) normalizes to the clean version.
- Verify the preview iframe loads correctly for public/shared files.
