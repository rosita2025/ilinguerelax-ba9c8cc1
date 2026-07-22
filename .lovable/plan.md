## Objetivo

Dejar de depender de tasas de conversión automáticas para LATAM y permitir que tú fijes manualmente el precio exacto por moneda en `/admin/products/:sku` (igual que Hotmart: MXN, COP, ARS, CLP, BRL, etc.).

## Cambios

### 1. Base de datos
Añadir una columna `local_prices JSONB` a `digital_products`:
```json
{ "MXN": 199, "COP": 33900, "ARS": 8500, "CLP": 9500, "BRL": 49, "PEN": 37 }
```
- Si una moneda está definida → se usa **tal cual** (sin conversión).
- Si no está → se cae al comportamiento actual (USD × tasa).

### 2. Admin `/admin/products/:sku`
Nueva sección **"Precios por moneda (LATAM)"** con inputs para: MXN, COP, ARS, CLP, BRL, PEN, UYU, BOB, PYG, CRC, DOP, GTQ, HNL, NIO, VES. Cada campo vacío = usar conversión automática USD.

### 3. Frontend
Actualizar `useLocalCurrency` / `formatLocalPrice` para leer `local_prices[currency]` del producto antes de aplicar la tasa. Sticky bar, cart drawer, product pages y checkout tomarán el precio manual automáticamente.

### 4. Checkout
El precio cobrado sigue en USD (Stripe/PayPal/MP). El precio local es solo **visual** para no asustar al cliente con conversiones infladas — igual que hoy.

## Resultado
- Tú controlas el precio exacto que ve cada país.
- Cero dependencia de tasas obsoletas.
- Igualas exactamente los precios de Hotmart.

¿Procedo?
