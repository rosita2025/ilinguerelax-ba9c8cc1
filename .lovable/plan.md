# Plan de Normalización de Moneda para Ads (Facebook, Pinterest, Google)

El objetivo es asegurar que todos los eventos de seguimiento enviados a plataformas publicitarias (Meta Pixel, Google Ads, Pinterest) utilicen **únicamente USD**, independientemente de la moneda local mostrada al usuario, para mantener la consistencia en los reportes de ROAS y atribución.

## Cambios Realizados (Preparación)
- [x] Creada función `convertToUSD` en `src/i18n/index.ts` para conversión centralizada basada en tasas de cambio internas.
- [x] Inyectada lógica de normalización en `trackHotmartEvent` y `useHotmartPixel` en `src/hooks/useMetaPixel.ts`.
- [x] Inyectada lógica de normalización en `trackGAEvent` en `src/hooks/useGoogleAnalytics.ts`.
- [x] Añadida prop `usdValue` a `StickyBuyBar` y actualizada en páginas de producto (5,000 Palabras y Patrones Especiales).

## Tareas Pendientes (Implementación Final)

### 1. Reforzar el Checkout Interno
- [ ] **Archivo**: `src/pages/Checkout.tsx`
  - Asegurar que el evento `InitiateCheckout` enviado al Pixel use el valor USD base del producto obtenido de la base de datos, en lugar del total calculado en moneda local.
- [ ] **Archivo**: `src/components/checkout/PaymentMethodsGroup.tsx`
  - Revisar las notificaciones de abandono de carrito y errores de pago para que reporten el valor en USD.

### 2. Estandarizar seguimiento de Pinterest
- [ ] **Archivo**: `src/components/PinterestSave.tsx`
  - El botón de guardar en Pinterest actualmente dispara un evento `trackCustom` en el Pixel. Asegurar que si en el futuro se añade valor económico, este sea en USD.

### 3. Verificación de flujo
- [ ] Validar que un usuario de México vea MXN en la interfaz, pero el navegador dispare `fbq('track', 'AddToCart', { value: 14.30, currency: 'USD' })`.

## Notas de Seguridad y Atribución
- Esta normalización no afecta el cobro real al cliente, solo el reporte publicitario.
- Se mantiene la lógica de `hasPixelConsent` para respetar privacidad.
