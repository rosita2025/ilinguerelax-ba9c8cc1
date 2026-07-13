## Objetivo

Que los 10 productos activos en `/admin/products` usen el mismo flujo de compra regional (Perú/VE/CU/NI/Global → checkout interno, LATAM → Hotmart) tanto en botón principal como en Sticky Bar, y que todos tengan entrada válida en `/checkouts/:slug` con precio nativo PEN + precios por región.

## Alcance (10 productos activos)

| # | SKU admin | Página | Slug checkout |
|---|---|---|---|
| 1 | patrones-especiales-alfabeto-combinaciones-secretas-ingles | ProductPatronesEspeciales | patrones-ingles ✓ |
| 2 | 1-000-verbos-esenciales-en-ingles-... | Product1000Verbos | 1000-verbos ✓ |
| 3 | 5-000-palabras-en-ingles-... | Product5000 | 5000-palabras ✓ |
| 4 | 8-000-palabras-en-ingles-... | Product8000 | 8000-palabras ✓ |
| 5 | 500-preguntas-en-ingles-... | Product500Preguntas | 500-preguntas ✓ |
| 6 | 100-mapas-mentales-...-coreano | ProductCoreanoRelax | coreano-100-mapas ✓ |
| 7 | 5-000-spanish-words-... | ProductSpanish5000Digital | 5000-spanish-words ✓ |
| 8 | 500-questions-in-spanish-... | ProductSpanish500Questions | **falta** → `500-questions-spanish` |
| 9 | 1-000-verbs-in-spanish-... | ProductSpanish1000Verbs | **falta** → `1000-verbs-spanish` |
| 10 | 1-000-palabras-en-ingles-...-hispano | (sin página dedicada, usa ProductDynamic) | **falta** → `1000-palabras-hispano` |

## Cambios

### 1. Ampliar `src/config/checkoutCatalog.ts`
Agregar los 3 slugs faltantes con `price`, `pricePen`, `regionPrices` (latam/global/tienda) y `adminSku` sacados de `digital_products`. Actualizar los 7 existentes para que `pricePen` y `regionPrices.tienda` coincidan exactamente con el admin (Perú S/28.90 para coreano, etc.).

### 2. Nuevo hook `useRegionalBuyUrl(adminSku, hotmartUrlOverride?)`
Centraliza la lógica que hoy vive dentro de `Product5000.tsx`:
- Perú → `/checkouts/<slug>` (interno, misma pestaña)
- VE/CU/NI/Global → `/checkouts/<slug>` (interno, misma pestaña)
- LATAM (MX/CO/CL/AR/…) → URL Hotmart (nueva pestaña)
- Devuelve `{ url, target, label, isInternal, tier, country }` con textos i18n (ES/EN/FR/PT)

Resuelve el slug leyendo `CHECKOUT_CATALOG` (mapa inverso adminSku → slug).

### 3. Actualizar CTA principal + StickyBuyBar en cada página
Sustituir el bloque manual de `useCountryTierRouting + TIENDA_CHECKOUT_x + HOTMART_x` por el hook nuevo en los 9 archivos con página propia. `ProductDynamic.tsx` recibe el mismo tratamiento para cubrir el producto 10.

### 4. Sanidad del catálogo
Agregar test-lite en dev (`useEffect` en `AdminProducts.tsx`) que loguea `console.warn` si un `digital_products.active=true` no tiene entrada en `CHECKOUT_CATALOG` — así los nuevos productos futuros se detectan solos.

## Fuera de alcance
- Configurar upsells (ya se hace en `/admin/products` → tabla `product_upsells`)
- Cambios visuales de cada página producto
- Nuevos productos que aún no existen en admin

## Detalles técnicos

- Detección de país: reutilizar `useRegionTier` (ya IP+manual override).
- LATAM sin `hotmartUrl` en admin → fallback al checkout interno USD (evita "botón muerto").
- Sticky bar y CTA principal comparten la misma URL/label para consistencia.
- Todo el trabajo es frontend; sin migraciones ni cambios en edge functions.

## Verificación al final
- `tsgo --noEmit`
- Playwright rápido: cambiar `ilr_country_manual` a PE, MX y US, y confirmar que en cada producto el botón cambia de texto y destino.
