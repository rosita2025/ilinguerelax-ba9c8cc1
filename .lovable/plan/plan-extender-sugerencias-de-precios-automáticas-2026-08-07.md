# Plan - Extender Sugerencias de Precios Automáticas

El usuario solicita configurar las tasas de cambio específicas para las sugerencias automáticas de precios en moneda local para países latinoamericanos, de modo que aparezcan tanto en el panel de administración (`admin/productos/:sku`) como en la página del producto (`products/:sku`).

## Cambios Propuestos

### 1. Actualizar `AdminProductEdit.tsx`
- Actualmente, las sugerencias en el administrador están limitadas a MXN, COP, ARS y CLP con tasas hardcodeadas.
- Se modificará el mapeo de sugerencias para incluir todos los países listados (BRL, UYU, PYG, BOB, CRC, DOP, GTQ, HNL, NIO, VES) utilizando las tasas definidas en `src/i18n/index.ts`.
- Esto hará que el botón "Sug:" aparezca para todas las monedas latinoamericanas basándose en la tasa de cambio global del proyecto.

### 2. Sincronizar Tasas de Cambio
- Asegurar que el cálculo de `regionPrice` en el componente de administración sea consistente con `exchangeRates` de `src/i18n/index.ts`.

## Plan de Verificación
- Entrar a `/admin/productos/:sku` y verificar que ahora aparecen botones "Sug:" para monedas adicionales como BRL, PEN, VES, etc.
- Verificar que al hacer clic en una sugerencia, el valor se cargue correctamente en el campo de `local_prices`.
- Confirmar que en la página pública del producto, los precios mostrados coincidan con los calculados si no hay un override manual.
