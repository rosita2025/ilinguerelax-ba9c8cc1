# Notificaciones por email de envío y tracking

## Qué pasó con el pedido ILR-ST-1ADAPRPX

Verificado en los registros: el tracking sí se guardó (06:14, estado `shipped`, número `www.amazon.com/tracking`), y el sistema **sí intentó** enviar el correo a `car.ali.dom.crad@gmail.com`, pero el proveedor lo rechazó:

```text
ERROR Resend send failed [422]: "The `to` field must be a `string`."
INFO  Tracking email sent to car.ali.dom.crad@gmail.com   <-- log falso
```

Causa raíz: el correo de tracking se arma con el formato antiguo (`to: [{email, name}]` y `htmlContent`), mientras que el ayudante de envío espera `to: "correo"` y `html`. Además el código imprime "enviado" aunque el envío falle, y no registra nada en el historial de correos, por eso en el panel parecía todo correcto.

## Qué se va a implementar

1. **Corregir el envío del correo de tracking** (formato correcto de destinatario y contenido) para que salga de verdad en pedidos manuales, Shopify y de pasarela (Stripe/dLocal).
2. **Registrar el resultado real**: guardar cada intento en el historial de correos y en el historial del pedido (`tracking_email_sent` / `tracking_email_failed`), y mostrar error en el panel si falla, en vez de decir "enviado".
3. **Aviso previo para pedidos con libro físico**: cuando el pedido ya tiene su parte digital entregada pero todavía no hay tracking, enviar un correo de "tu material digital ya está en tu correo; el número de seguimiento del libro te lo enviamos apenas se despache". Se envía una sola vez por pedido.
4. **Correo al cambiar el estado del envío**: además del alta de tracking, avisar cuando el envío pasa a *enviado* o *entregado*, y cuando se corrige/actualiza un número de seguimiento ya existente (correo de actualización, no duplicado).
5. **Botón "Reenviar email al cliente"** en cada pedido de `/admin/orders-physical`, con confirmación visible de éxito o error y la fecha del último envío.
6. **Reenviar manualmente el correo pendiente** del pedido ILR-ST-1ADAPRPX una vez corregido el envío, para que el cliente reciba su tracking.

## Detalles técnicos

- `supabase/functions/list-admin-orders/index.ts` (acción `update_tracking`): normalizar la llamada a `sendEmail` (`to: string`, `html`), comprobar `result.error`, insertar en `email_send_log` y en `order_events`, y devolver el estado del correo al panel.
- Nueva plantilla compartida en `supabase/functions/_shared/` para los tres correos (aviso previo, tracking nuevo, tracking actualizado/entregado), con la marca actual (teal, Plus Jakarta Sans) y enlace a `/mi-pedido`.
- Nueva acción `resend_tracking_email` en la misma función, invocada desde `src/pages/AdminPhysicalOrders.tsx`.
- El aviso previo se dispara desde el flujo que ya crea `physical_shipments` (webhooks de Stripe y dLocal), controlado por una clave de idempotencia por pedido para no duplicar correos.
- Sin cambios de esquema salvo, si hace falta, un campo de marca de tiempo del último aviso enviado en `physical_shipments`.
