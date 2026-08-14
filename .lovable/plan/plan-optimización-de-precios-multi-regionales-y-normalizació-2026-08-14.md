# Plan - Optimización de Precios Multi-Regionales y Normalización de USD

El usuario reporta que al usar un precio base de $27 USD, el sistema está calculando montos que resultan en cobros excesivos (ej. $35 USD) en algunas regiones. Esto se debe a discrepancias entre las tasas de cambio automáticas y la falta de normalización en el redondeo de los "overrides" de USD regionales.

## Objetivos
1.  **Ajustar tasas de cambio**: Sincronizar las tasas de cambio en `i18n` y `Edge Functions` para que reflejen valores más realistas y menos inflados para el comprador local.
2.  **Redondeo Estricto**: Asegurar que cualquier cálculo de precio (especialmente con overrides regionales) se redondee a exactamente 2 decimales en USD para evitar discrepancias de céntimos que escalan.
3.  **Corrección de Colombia y México**: Específicamente para el caso de $27 -> $35, ajustar la tasa de COP y MXN para que el valor final sea más cercano al precio base deseado o ligeramente inferior para incentivar la compra en LatAm.

## Detalles Técnicos
-   **Tasa COP**: Cambiar de 4300 a **4500** (aproximadamente) para que un precio de $27 USD resulte en un monto local que, al ser procesado por pasarelas internacionales, no se infle por encima del valor original.
-   **Tasa MXN**: Ajustar de 20 a **20.5** para mayor estabilidad.
-   **Normalización**: Modificar `catalogPricing.ts` y `useLocalCurrency.ts` para aplicar `Math.round(val * 100) / 100` en cada paso del cálculo de overrides regionales.
-   **Sincronización**: Garantizar que `FX_USD_TO_LOCAL` en el backend sea idéntico a `exchangeRates` en el frontend.

## Archivos a Modificar
-   `src/i18n/index.ts`: Actualizar `exchangeRates`.
-   `supabase/functions/_shared/fxRates.ts`: Sincronizar `FX_USD_TO_LOCAL`.
-   `supabase/functions/_shared/catalogPricing.ts`: Refinar la lógica de `pickTierPrice` para asegurar redondeo.
-   `src/hooks/useLocalCurrency.ts`: Asegurar que `usdReference` y `activeUsdAmount` mantengan precisión de 2 decimales.
