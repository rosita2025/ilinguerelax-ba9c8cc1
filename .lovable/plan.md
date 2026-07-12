# Subdominios regionales para iLingue Relax (Opción A)

Todos los subdominios apuntan al **mismo proyecto** Lovable. El código detecta el subdominio en el navegador y fuerza país, idioma, moneda, pasarela de pago y SEO.

## Alcance

Subdominios de la fase 1:

| Subdominio | País | Idioma | Moneda | Pasarela |
|---|---|---|---|---|
| `www.ilinguerelax.com` | Global (default) | ES | USD | Stripe |
| `us.ilinguerelax.com` | USA | EN | USD | Stripe |
| `ca.ilinguerelax.com` | Canadá | EN | CAD | Stripe |
| `pe.ilinguerelax.com` | Perú | ES | PEN | Yape/Plin + Stripe |
| `mx.ilinguerelax.com` | México | ES | MXN | Mercado Pago |
| `es.ilinguerelax.com` | España | ES | EUR | Stripe |
| `fr.ilinguerelax.com` | Francia | FR | EUR | Stripe |
| `br.ilinguerelax.com` | Brasil | PT | BRL | Mercado Pago |

## Pasos que hago yo (código)

1. **Nuevo módulo `src/lib/subdomainRegion.ts`**
   - Función `getSubdomainRegion()` que lee `window.location.hostname` y devuelve `{ country, language, currency, paymentGateway, tier }`.
   - Si el subdominio no coincide con la tabla → fallback a detección por IP actual (`ipapi.co`).

2. **Hook `useSubdomainRegion()`**
   - Envuelve la lógica y expone la región activa a toda la app.
   - Se integra con el `useRegionTier()` existente: el subdominio **sobrescribe** la detección por IP.

3. **Ajustes en componentes existentes**
   - `Checkout.tsx`: usar la moneda/gateway del subdominio en vez de IP.
   - `CountryFlagSelector.tsx`: mostrar la bandera del subdominio como "actual" y ofrecer enlaces para cambiar a otro subdominio (`us.` ↔ `pe.` ↔ `mx.`…).
   - `i18n` inicial: forzar el idioma del subdominio al cargar.

4. **SEO por subdominio**
   - `SEO.tsx`: emitir `hreflang` con las URLs de cada subdominio (`us.ilinguerelax.com/…` `hreflang="en-US"`, etc.).
   - `canonical` = URL del subdominio actual (no forzar a `www.`).
   - `scripts/generate-sitemap.ts`: generar un sitemap por subdominio (`sitemap-us.xml`, `sitemap-pe.xml`…) y un índice `sitemap.xml` que los liste.
   - `robots.txt`: agregar todos los `Sitemap:` de cada subdominio.

5. **Banner de "sugerencia de región"**
   - Si el visitante llega a `www.` pero su IP dice México → banner sutil: *"¿Prefieres visitar mx.ilinguerelax.com?"*
   - Se puede descartar; se recuerda con cookie.

6. **Admin**
   - En `/admin/productos` mostrar en qué subdominios está publicado cada producto (todos por defecto; opcional excluir alguno).

## Pasos que haces tú (DNS + Lovable)

1. **En tu registrador DNS** (donde tengas `ilinguerelax.com`) creas un registro **A** por cada subdominio:
   ```
   Tipo: A   Nombre: us    Valor: 185.158.133.1
   Tipo: A   Nombre: pe    Valor: 185.158.133.1
   Tipo: A   Nombre: ca    Valor: 185.158.133.1
   Tipo: A   Nombre: mx    Valor: 185.158.133.1
   Tipo: A   Nombre: es    Valor: 185.158.133.1
   Tipo: A   Nombre: fr    Valor: 185.158.133.1
   Tipo: A   Nombre: br    Valor: 185.158.133.1
   ```
   (Si usas Cloudflare, activa "proxy" solo si vas a marcar la casilla correspondiente en Lovable.)

2. **En Lovable → Project Settings → Domains → Connect Domain** agregas cada subdominio uno por uno. Lovable verificará el DNS y emitirá SSL automático (5-30 min).

3. **En Google Search Console**: agregar cada subdominio como propiedad separada (te ayudo a generar los meta-tags de verificación después).

## Detalles técnicos

- La detección se hace **client-side** con `window.location.hostname`, por lo que no se rompe el SSR/preview.
- Durante desarrollo (`localhost`, `*.lovable.app`) → cae al modo IP actual, sin cambios.
- El catálogo de productos sigue siendo **único** en Supabase; solo cambian precio mostrado y pasarela.
- Los emails transaccionales incluirán el subdominio de origen del pedido para tracking.
- Ningún cambio destructivo en pagos existentes: si Stripe ya está configurado en modo live, sigue funcionando; solo se selecciona la moneda correcta según subdominio.

## Fuera de este plan (posibles fases 2/3)

- Traducciones completas de páginas de producto por idioma nativo (hoy solo IU tiene i18n).
- Métodos de pago locales adicionales (PIX en `br.`, Bizum en `es.`).
- CDN geolocalizado.

## Fase 1 primero — confirmación

Antes de que empiece a escribir código, confírmame:

1. ¿La tabla de mapeo país→moneda→pasarela está OK, o quieres cambiar algo (por ejemplo `ca.` en francés en vez de inglés)?
2. ¿Empezamos con los 7 subdominios de la tabla, o solo con los 3 primeros (`us`, `pe`, `ca`) para probar?
3. ¿Quieres el banner de "cambiar a tu región" activado desde el inicio, o lo dejamos para después?
