# Plan: Sincronización de Precios Dinámicos desde el Admin

Vincular las páginas de productos y la barra de compra persistente (Sticky Buy Bar) con la configuración de precios real de la base de datos (Supabase) para eliminar valores estáticos en PEN y asegurar que se respeten las 3 regiones (LATAM, Global, Tienda) y la conversión automática por IP.

## Cambios Propuestos

### Hooks y Lógica de Precios
- **`src/hooks/useAdminPricing.ts`**: Asegurar que todos los campos de precios regionales (`price_usd`, `price_usd_latam`, `price_usd_tienda`, `price_pen`) y los tachados se lean correctamente.
- **`src/hooks/useCountryTierRouting.ts`**: Verificar que la lógica de selección de tier (Región 1, 2 o 3) coincida exactamente con los requisitos:
    - **LATAM**: Usa `price_usd_latam`.
    - **USA/CAN/UK/Europa**: Usa `price_usd` (Global).
    - **Asia/Resto**: Usa `price_usd_tienda`.
    - **Perú**: Prioriza `price_pen` si existe.

### Componentes de Interfaz
- **`src/components/StickyBuyBar.tsx`**: Eliminar cualquier lógica de parsing de texto para el precio. Recibir el objeto `tier` completo o los valores dinámicos calculados para asegurar que el símbolo, monto y código de moneda sean exactos.
- **`src/pages/ProductSpanish5000.tsx`** y similares:
    - Refactorizar el `useMemo` de `campaign` para usar exclusivamente los datos de `useAdminPricing` y `useCountryTierRouting`.
    - Reemplazar cualquier string estático (como "S/ 131.20") por llamadas a `tier.priceLabel`.
    - Asegurar que el Hero, los botones y la Sticky Bar compartan el mismo estado de precio.

### Internacionalización
- **`src/i18n/I18nContext.tsx`**: Confirmar que los cambios en el selector de país disparen eventos que fuercen la actualización de los hooks de precios en las páginas de producto.

## Detalles Técnicos
- Uso de `useAdminPricing(SKU)` como fuente de verdad.
- Mapeo de regiones en `useCountryTierRouting` basado en ISO 3166-1 alpha-2.
- Conversión de divisas usando `exchangeRates` sincronizados con el backend.

## Verificación
- Simulación de IP/País para verificar que un usuario en España vea EUR (Región 2), uno en México vea MXN (Región 1) y uno en Perú vea PEN.
- Verificación en el Admin de que al cambiar un precio, la página del producto se actualice (vía polling/broadcast existente).
