## Integración KunfuPay (LATAM: OXXO, SPEI, Nequi, PSE, Pix)

### Contexto de la API
- Base: `https://api.kunfupay.com`
- Auth: header `X-API-Key: kfp_live_<id>.<secret>`
- Moneda: **EUR** (KunfuPay convierte a moneda local en el checkout hosted)
- Flujo: crear producto → crear payment-link → redirigir al `paymentUrl` hosted → recibir webhook firmado (HMAC SHA256)

### Métodos de pago disponibles vía KunfuPay
- 🇲🇽 México: OXXO, SPEI
- 🇨🇴 Colombia: Nequi, PSE
- 🇧🇷 Brasil: Pix

En países fuera de esa lista no se ofrece KunfuPay (sigue Stripe/PayPal/MP).

### Secrets a solicitar
- `KUNFUPAY_API_KEY` (formato `kfp_live_...` o `kfp_test_...`)
- `KUNFUPAY_WEBHOOK_SECRET` (para verificar HMAC del webhook)

### Cambios de base de datos
Tabla `kunfupay_orders`:
- `order_id` (nuestro, ILR-KFP-XXXX)
- `kunfupay_product_id`, `kunfupay_sale_id`, `kunfupay_payment_link_id`
- `external_reference`, `payment_url`
- `customer_email`, `customer_name`, `customer_country`
- `amount_eur`, `items` (jsonb con SKUs)
- `status` (`created` | `completed` | `failed` | `expired`)
- `raw_webhook` (jsonb última carga)
- GRANTs + RLS solo service_role

### Edge Functions
1. **`kunfupay-create-order`** (POST)
   - Recibe `{ items, customer, country }`
   - Crea/reutiliza producto en KunfuPay (idempotency por SKU-hash)
   - Crea payment-link con `Idempotency-Key = order_id`, `successUrl`, `failureUrl`
   - Guarda registro en `kunfupay_orders` con status `created`
   - Envía correo "Recibimos tu pedido" (pendiente)
   - Devuelve `{ paymentUrl, orderId }`

2. **`kunfupay-webhook`** (POST público, sin JWT)
   - Verifica firma HMAC SHA256 (`sha256=<hex>`)
   - Deduplica por `payment.id + eventType`
   - En `productPayment.completed`: marca `completed`, dispara **Gracias por tu compra** + **Materiales digitales** + notificación admin (mismo patrón que Stripe/PayPal — no se saltan correos)
   - En `failed` / `expired`: actualiza estado, sin correo extra

### Integración en el frontend
- `PaymentMethodsGroup.tsx`: agregar tarjetas condicionales por país detectado (MX → OXXO/SPEI, CO → Nequi/PSE, BR → Pix). Un único botón "Pagar con KunfuPay" por método (todos van al mismo hosted checkout; KunfuPay filtra el método por país).
- Al elegir → invoke `kunfupay-create-order` → `window.location.href = paymentUrl`
- Página `CheckoutKunfupaySuccess.tsx` y `CheckoutKunfupayFailure.tsx` para el retorno del hosted checkout.

### Admin
- Añadir KunfuPay a `list-purchases-status` (proveedor `kunfupay`) para que aparezca en `/admin/purchases-status`.
- Filtro por proveedor incluye "KunfuPay".

### Anti-duplicados de correos (misma regla que ya validamos)
- Manual: 3 correos (pendiente + gracias + materiales)
- Stripe / PayPal / MP tarjeta / **KunfuPay**: 2 correos (gracias + materiales)
- MP efectivo/transfer: 3 correos (pendiente + gracias + materiales)

### Nota sobre moneda
Todos los importes se envían a KunfuPay en **EUR**. Se convierten desde USD del producto usando tasa fija configurable (arranco con `USD → EUR = 0.92`). El comprador ve el monto en su moneda local dentro del checkout hosted de KunfuPay.

### Orden de ejecución
1. Pedir `KUNFUPAY_API_KEY` y `KUNFUPAY_WEBHOOK_SECRET` con `add_secret`
2. Migración `kunfupay_orders`
3. Edge functions `kunfupay-create-order` y `kunfupay-webhook`
4. UI en `PaymentMethodsGroup.tsx` + páginas de retorno
5. Integración en admin
6. Configurar URL del webhook en el dashboard de KunfuPay (te la paso al terminar)
