# Carrito persistente y checkout unificado

## Problema

Hoy cada producto genera su propio flujo aislado:
- Cliente entra a Producto A → agrega → cierra web.
- Vuelve horas después, entra a Producto B → agrega → va a checkout → **solo ve B** (perdió A).
- Los emails de recuperación llegan separados por SKU (a veces 2–3 correos el mismo día).
- Los upsells se ofrecen solo en el momento, no se recuperan luego.

El cliente termina abriendo checkout varias veces, se confunde, y no compra.

## Objetivo

Un único carrito acumulativo por cliente que:
1. Persista entre sesiones y dispositivos (no se pierde al cerrar la web).
2. Combine automáticamente productos agregados en distintos momentos.
3. Ofrezca los upsells pendientes dentro del mismo checkout.
4. Envíe **un solo email** de recuperación con **todos los productos acumulados**.

## Cómo va a funcionar

### 1. Identidad del carrito
- Cada visitante recibe un `cart_token` (cookie de 30 días, persistente).
- Si el cliente escribe su email en cualquier punto (checkout, popup, newsletter), asociamos el `cart_token` a ese email.
- Al volver desde un email de recuperación, el link incluye el token → recuperamos el carrito completo.

### 2. Tabla `persistent_carts` en la base
Guarda: `cart_token`, `email` (opcional), `items` (array de {sku, qty, price, added_at}), `upsells_declined` (array), `last_activity`, `country`, `currency`.

### 3. Comportamiento en el frontend
- `CartDrawer` y `Checkout` leen del carrito persistente en lugar de solo estado local.
- Al agregar producto: merge con lo existente (no reemplazar).
- Al entrar a `/checkout`: muestra TODOS los items acumulados + panel de upsells sugeridos (los que aplican a cualquier producto del carrito y aún no fueron rechazados).

### 4. Emails de recuperación consolidados
- El cron `send-cart-reminders` ya agrupa por email — se ajusta para leer de `persistent_carts` en vez de `abandoned_carts` sueltos.
- Un solo correo a los 30 min / 24h / 5 días con la lista completa de productos + botón "Retomar mi carrito" que restaura el `cart_token`.
- Deduplicación atómica ya existente se mantiene.

### 5. Limpieza
- Si el cliente completa la compra → carrito se vacía automáticamente.
- Si pasan 30 días sin actividad → se archiva.

## Detalles técnicos

- Nueva tabla `public.persistent_carts` con RLS (lectura por token, escritura por edge function).
- Nuevo edge function `cart-sync` (GET/POST) para leer y actualizar carrito por token.
- Modificar `CartDrawer.tsx`, `Checkout.tsx`, `UpsellPanel.tsx` para usar el hook `usePersistentCart()`.
- Modificar `send-cart-reminders` para leer de `persistent_carts` agrupado, no de `abandoned_carts` por SKU.
- Migrar carritos actuales de `abandoned_carts` al nuevo modelo (mantener tabla vieja como histórico).

## Fuera de alcance

- No cambia el flujo de pago (Stripe/PayPal/MP/Binance siguen igual).
- No cambia diseño de emails, solo el contenido agrupado.
- No toca entrega digital ni Hotmart.

¿Apruebas para implementar?
