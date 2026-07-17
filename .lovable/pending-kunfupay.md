# PENDIENTE · Integración KunfuPay

## Estado
En pausa. Al intentar guardar los secrets `KUNFUPAY_API_KEY` y `KUNFUPAY_WEBHOOK_SECRET` salió error de API key. Retomar cuando el usuario tenga la key válida y confirme.

## Plan aprobado
Ver `.lovable/plan.md` (KunfuPay para OXXO/SPEI México, Nequi/PSE Colombia, Pix Brasil).

## Datos ya recopilados
- Docs: https://business.kunfupay.com/home/external-integrations/products-docs
- Base API: `https://api.kunfupay.com`
- Auth header: `X-API-Key: kfp_live_<id>.<secret>`
- Moneda EUR (KunfuPay convierte a moneda local)
- Webhook firma: HMAC SHA256, header `sha256=<hex>`
- Eventos: `productPayment.completed | failed | expired`
- Idempotencia: `Idempotency-Key` en create-order/create-product; dedupe por `payment.id + eventType`

## Al retomar, orden:
1. Pedir de nuevo `KUNFUPAY_API_KEY` (kfp_live_...) y `KUNFUPAY_WEBHOOK_SECRET` con add_secret.
2. Migración `kunfupay_orders`.
3. Edge functions `kunfupay-create-order` y `kunfupay-webhook`.
4. UI en `PaymentMethodsGroup.tsx` (filtro por país MX/CO/BR) + páginas de retorno.
5. Integrar en `/admin/purchases-status`.
6. Dar al usuario la URL del webhook para pegarla en el dashboard de KunfuPay.

## Nota del error
El intento anterior de `add_secret` fue interrumpido. Volver a llamarlo cuando el usuario diga que ya tiene la key correcta.
