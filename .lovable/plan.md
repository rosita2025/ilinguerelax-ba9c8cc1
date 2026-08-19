# Corregir el correo de tracking: número real, transportista y nombre del cliente

## Qué muestra el correo recibido

El correo salió bien (diseño, enlaces, pie), pero el contenido es incorrecto:

- Número de seguimiento: `www.amazon.com/tracking` (es una URL genérica, no un código de rastreo)
- Transportista: `Courier` (valor por defecto)
- Saludo: `Hola Cliente` (sin el nombre real)

## Causa confirmada

En la base de datos, el envío `ILR-ST-1ADAPRPX` está guardado así:

```text
tracking_number   = "www.amazon.com/tracking"
shipping_provider = NULL
customer_name     = NULL
shipping_address  = NULL
```

Es decir, el correo reflejó fielmente lo que se guardó en el panel: se escribió una URL en el campo del número, no se eligió transportista y el pedido no tiene nombre de cliente registrado. El sistema aceptó ese dato sin validarlo y sin mostrar una vista previa.

## Qué se va a corregir

1. **Validación del número de seguimiento en `/admin/orders-physical`**
   - Rechazar valores que sean solo una URL genérica sin código (por ejemplo `www.amazon.com/tracking`).
   - Exigir un código real (mínimo de caracteres alfanuméricos) cuando se marca el pedido como enviado.
   - Si el usuario pega una URL completa de rastreo que sí contiene el código, extraerlo automáticamente y guardar por separado el código y el enlace.

2. **Transportista obligatorio**
   - Al guardar un tracking, pedir el transportista con un desplegable (Amazon, DHL, FedEx, UPS, Serpost, Olva, Correos, Otro) además del campo libre.
   - Eliminar el fallback silencioso a "Courier": si no hay transportista, no se envía el correo y el panel lo avisa.

3. **Nombre real del cliente**
   - Antes de enviar, buscar el nombre en `physical_shipments`, y si está vacío, recuperarlo de `order_events` / `digital_email_sends` / `manual_payments` del mismo pedido.
   - Guardar ese nombre en `physical_shipments` para futuros correos.
   - Mantener "Hola" sin nombre como saludo neutro si realmente no existe el dato (en lugar de "Hola Cliente").

4. **Vista previa antes de enviar**
   - En el panel, al guardar el tracking se muestra un resumen: destinatario, número, transportista y enlace de rastreo generado, con botón de confirmar envío.
   - Así se detecta cualquier dato mal escrito antes de que llegue al cliente.

5. **Corregir este pedido concreto**
   - Actualizar `ILR-ST-1ADAPRPX` con el número de seguimiento real y el transportista correcto, completar el nombre del cliente y reenviar el correo corregido con el botón de reenvío.
   - Para esto hace falta que indiques el código de rastreo real y el transportista.

## Detalles técnicos

- `src/pages/AdminPhysicalOrders.tsx`: validación del input, selector de transportista, diálogo de vista previa/confirmación antes de llamar a la función.
- `supabase/functions/list-admin-orders/index.ts`: validar en el servidor (no confiar solo en el navegador), resolver el nombre del cliente desde las tablas de pedidos y persistirlo, y no enviar el correo si faltan datos obligatorios (devolviendo un error claro al panel).
- `supabase/functions/_shared/shippingEmails.ts`: separar `trackingNumber` (código visible) de `trackingUrl` (enlace), y usar saludo sin "Cliente" cuando no haya nombre.
- Sin cambios de esquema en la base de datos.

## Pregunta pendiente

Para reenviar el correo corregido de `ILR-ST-1ADAPRPX` necesito el número de seguimiento real y el transportista (por ejemplo Amazon, Serpost, DHL).
