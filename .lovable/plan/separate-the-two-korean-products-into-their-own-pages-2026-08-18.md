# Separate the two Korean products into their own pages

Right now both Korean URLs render the exact same page component (`ProductCoreanoRelax`), which was recently rebranded to "1,000 palabras esenciales". That is why the mind-maps URL shows the wrong product.

Confirmed in `src/App.tsx`:
- `/products/100-mapas-mentales-para-aprender-coreano-hangul-c1` -> ProductCoreanoRelax
- `/products/1-000-palabras-esenciales-para-aprender-coreano` -> ProductCoreanoRelax

## Target result

1. `/products/100-mapas-mentales-para-aprender-coreano-hangul-c1` = **+100 Mapas Mentales de Coreano** (own page, mind-map imagery, mind-map copy, own price/SKU `100-mapas-mentales-para-aprender-coreano-hangul-c1`, checkout key `coreano-100-mapas`).
2. `/products/1-000-palabras-esenciales-para-aprender-coreano` = **Aprende las 1,000 palabras esenciales del coreano** (current page, unchanged, word-list imagery, SKU `1-000-palabras-esenciales-para-aprender-coreano`, $12).

## Changes

### New page: `src/pages/ProductCoreano100Mapas.tsx`
- Dedicated page for the mind-maps product, reusing the same layout patterns (SEO, Navbar, hero, features, preview carousel, FAQ, reviews, StickyBuyBar, Footer).
- Copy focused on mind maps: 100 visual mind maps, Hangul, thematic memorization.
- Preview carousel uses the mind-map assets (`coreano-mapa-01-saludos`, `-02-vocales`, `-09-familia`, `-15-ropa`, `-16-cuerpo`, `-18-escuela`, `-19-profesiones`, `objetos-casa`).
- Pricing via `useAdminPricing` / `useCountryTierRouting` with `adminSku = 100-mapas-mentales-para-aprender-coreano-hangul-c1`, checkout path from the `coreano-100-mapas` catalog entry.
- Canonical URL, title, description and SKU set for the mind-maps product.

### `src/App.tsx`
- Point `/products/100-mapas-mentales-para-aprender-coreano-hangul-c1` at the new page.
- Leave the 1,000-words route as is.
- Keep `/vista-previa/coreano-100-mapas-mentales` pointing at a mind-maps preview.

### `src/pages/VistaPreviaCoreano.tsx`
- This preview is currently branded 1,000 words but is routed from the `coreano-100-mapas-mentales` path. Add a matching route `/vista-previa/coreano-1000-palabras` for the words preview (the words page links to it and it currently 404s), and keep the mind-maps preview path mapped to mind-map content.

### `src/pages/ProductCoreanoRelax.tsx`
- No content changes; it stays the 1,000-words page.

## Verification
- Open both product URLs and confirm each shows its own title, images, price and checkout target.
- Confirm the "Ver vista previa completa" link from the words page resolves.
