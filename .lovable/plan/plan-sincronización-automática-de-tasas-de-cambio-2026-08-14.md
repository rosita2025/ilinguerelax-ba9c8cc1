# Plan - Sincronización Automática de Tasas de Cambio

El usuario desea automatizar la actualización de las tasas de cambio para que el motor de precios utilice valores recientes, manteniendo un historial y permitiendo ajustar los precios locales (bajándolos para evitar que el equivalente en USD sea excesivo).

## Objetivos
1.  **Persistencia**: Crear tablas en la base de datos para almacenar las tasas de cambio actuales y su historial.
2.  **Automatización**: Implementar una Edge Function que obtenga tasas reales de una API externa y las guarde en la base de datos periódicamente.
3.  **Integración**: Actualizar el motor de precios (frontend y backend) para priorizar las tasas de la base de datos sobre las constantes hardcoded.
4.  **Control de Precios**: Incluir un factor de ajuste (markup/discount) por moneda para cumplir con el pedido de "bajar el precio local".

## Detalles Técnicos
-   **Base de Datos**: 
    -   `public.exchange_rates`: `code` (PK), `rate` (USD base), `markup_percent` (por defecto 0), `last_updated`.
    -   `public.exchange_rate_history`: `code`, `rate`, `created_at`.
-   **Edge Function**: `sync-exchange-rates` usando `https://open.er-api.com/v6/latest/USD` (API gratuita sin API Key para uso moderado).
-   **Cron Job**: Programar la ejecución diaria usando `pg_cron`.
-   **Ajuste de Precios**: La fórmula será `PrecioLocal = PrecioUSD * (TasaAPI * (1 + markup_percent/100))`. Para "bajar el precio local", se usará un `markup_percent` negativo si es necesario.

## Archivos a Crear/Modificar
-   `supabase/migrations/<timestamp>_exchange_rates.sql`: Esquema de base de datos.
-   `supabase/functions/sync-exchange-rates/index.ts`: Lógica de sincronización.
-   `supabase/functions/_shared/fxRates.ts`: Leer de la DB con caché en memoria.
-   `src/lib/livePrices.tsx`: Suscribirse a cambios en tiempo real para el frontend.
-   `src/i18n/index.ts`: Modificar `exchangeRates` para que sea dinámico.
