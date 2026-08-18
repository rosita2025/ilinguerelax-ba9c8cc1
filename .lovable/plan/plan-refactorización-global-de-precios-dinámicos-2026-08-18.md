# Plan: Refactorización Global de Precios Dinámicos

Se implementará una lógica de precios 100% genérica y global que elimine cualquier dependencia de condiciones por país específicas (como "if country === 'PE'") en favor de un sistema basado en datos y tasas de cambio universales.

## Cambios Propuestos

### 1. Refactorización de `src/hooks/useCountryTierRouting.ts`
- **Función Pura de Procesamiento**: Implementar `getCountryPricing` para calcular precios "Ahora" y "Antes" basándose en:
  - Tasa de cambio del país (`exchangeRate`).
  - Precios base globales (Oferta vs. Normal).
  - Overrides manuales regionales (precios fijos).
- **Eliminación de Condicionales**: Quitar lógica específica para Perú o SKUs específicos (Spanish Digital) dentro del hook.
- **Normalización de Datos**: Asegurar que `priceLabel` y `originalLabel` se generen uniformemente usando `formatCurrencyAmount`.

### 2. Estructura de Datos y Tipos
- Asegurar que `CountryTierRouting` retorne todas las propiedades necesarias para el renderizado dinámico en cualquier componente (Hero, Sticky Bar, Checkout).

### 3. Verificación Global
- Validar que el sistema aplique la lógica correctamente para países con moneda local (MXN, COP, ARS, etc.) y países que operan en USD (VE, CU, NI).

## Detalles Técnicos
- Se utilizará `detectCurrency(countryCode)` y `exchangeRates[currency]` como fuentes de verdad para la conversión.
- La prioridad de precios será: `Valor Manual Local > (Precio Base Regional USD * Tasa Local) > (Precio Base Global USD * Tasa Local)`.
