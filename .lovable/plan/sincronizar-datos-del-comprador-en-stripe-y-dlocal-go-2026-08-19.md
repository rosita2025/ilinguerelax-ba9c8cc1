# Sincronizar datos del comprador en Stripe y dLocal Go

Objetivo: que el nombre completo, la dirección de envío y el teléfono (opcional) que el cliente escribe en el checkout viajen igual a Stripe y a dLocal Go, y queden guardados en el pedido para poder enviar el libro físico.

## Estado actual (verificado)

- Stripe ya recibe dirección: el checkout envía `address`, `city`, `state`, `zip` y el webhook los guarda en `physical_shipments`.
- dLocal Go NO envía dirección: solo manda nombre, email y teléfono; su webhook guarda únicamente el país, así que los pedidos por dLocal quedan sin dirección de envío en `/admin/orders-physical`.
- El teléfono hoy es obligatorio en el formulario (mínimo 7 caracteres) y, si falta, Stripe recibe el número falso `+10000000000`.

## Cambios propuestos

1. **Teléfono opcional**
   - Quitar el teléfono de los campos obligatorios del formulario de compra (se mantiene visible, marcado como "opcional").
   - Dejar de enviar el número falso `+10000000000`: si no hay teléfono, simplemente no se manda.

2. **dLocal Go recibe los mismos datos que Stripe**
   - El checkout enviará también dirección, ciudad, estado/provincia y código postal a la función de creación de pago de dLocal.
   - Esos datos se incluyen en los datos del pagador enviados a dLocal y se registran en el evento del pedido.
   - El webhook de dLocal guardará la dirección completa (no solo el país) en el envío físico.

3. **Coherencia en el panel de pedidos físicos**
   - Con lo anterior, los pedidos de Stripe y de dLocal muestran igual: nombre completo, email, teléfono si existe y dirección completa, listos para despachar.

## Detalles técnicos

- `src/components/checkout/BuyerInfoForm.tsx`: quitar `phoneValid` de la validación bloqueante y del enfoque automático de errores; etiquetar el campo como opcional.
- `src/components/checkout/PaymentMethodsGroup.tsx`:
  - Stripe: `contact.phone` pasa a ser opcional (sin placeholder falso).
  - dLocal: agregar `payerAddress`, `payerCity`, `payerState`, `payerZip` al body de `dlocal-create-payment`.
- `supabase/functions/create-checkout-prueba/index.ts`: hacer `phone` opcional en el esquema y no escribir metadata vacía.
- `supabase/functions/dlocal-create-payment/index.ts`: aceptar los nuevos campos (opcionales, con límite de longitud), incluirlos en `payer.address` del payload de dLocal y en la metadata de `order_events`.
- `supabase/functions/dlocal-webhook/index.ts`: leer la dirección desde la metadata del pedido y pasarla a `upsertPhysicalShipment` en vez de solo el país.
- Sin cambios de base de datos: `physical_shipments.shipping_address` ya es JSON y `upsertPhysicalShipment` nunca sobrescribe una dirección existente con una vacía.

## Validación

- Crear un pago de prueba con dLocal y confirmar en el evento del pedido y en `physical_shipments` que la dirección quedó guardada.
- Confirmar que un checkout sin teléfono se completa en Stripe y en dLocal sin errores de validación.
