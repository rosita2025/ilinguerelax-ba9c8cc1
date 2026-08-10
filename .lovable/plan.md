# Plan - Restore AI Generator and Improve SEO Navigation

The user reported that the "AI generator" is missing. Based on the codebase analysis, the AI blog generator is located in `/admin/seo`. The user might be referring to the fact that it's buried under the SEO tab or that they expected it in a more prominent place like the `AdminProductEdit` page or a dedicated top-level menu item. 

Additionally, I noticed that while `AdminSEO` has a generator, the `AdminProductEdit` page has a button for "Generar con IA" which might also be what they are referring to if it's not working or visible enough.

The user specifically mentioned "generador ai de pai" (AI generator for products/country?). They also recently asked about blog posts.

I will:
1.  **Add a dedicated "Blog & AI" item to the Admin Sidebar** to make the generator easier to find.
2.  **Verify the `AdminProductEdit` AI generation logic** and ensure it's prominently accessible.
3.  **Check if any Edge Function for generation is failing** (though recent logs showed fixes for Apimart).

## Proposed Changes

### 1. Admin Navigation
- Modify `src/components/admin/AdminNav.tsx` to include a more prominent "Blog & Generador IA" link.

### 2. Admin SEO Page
- Ensure the "Generador de posts SEO" section in `src/pages/AdminSEO.tsx` is clearly visible and functional.

### 3. Admin Product Edit
- Verify the `generateAIContent` functionality in `src/pages/AdminProductEdit.tsx`.

## Verification Plan
- Navigate to `/admin` and check for the new navigation items.
- Go to `/admin/seo` and verify the generator is present.
- Go to `/admin/productos/nuevo` and check the "Generar con IA" button.
- Check browser console for any 404s or 500s related to AI functions.
