# Plan - Validación Dinámica de Campos Físico vs Digital

Implementar una lógica de validación condicional en el checkout que ajusta los campos obligatorios y la visibilidad de la dirección según si el producto es físico o digital, bloqueando el pago hasta completar los datos.

## User Review Required

> [!IMPORTANT]
> - ¿El campo "Teléfono" debe ser obligatorio también para productos digitales? (El pedido dice "¡Obligatorio para verificación/soporte!", lo cual aplicaré).
> - ¿Prefieres que los botones de pago estén **deshabilitados** (grises) o que al hacer clic muestren el error y hagan scroll? (Implementaré ambos: deshabilitados visualmente y con alerta al clic para máxima claridad).

## Technical Details

### 1. Actualización de Validación Core
- Modificar `src/components/checkout/BuyerInfoForm.tsx`:
    - Actualizar la función `isBuyerValid` para incluir el teléfono como obligatorio siempre.
    - Asegurar que `isBuyerValid` verifique los 6 campos para físicos y 3 para digitales.
    - Ocultar condicionalmente la sección de `shippingAddress` si `hasPhysicalItems` es falso.

### 2. Interbloqueo de Pasarelas de Pago
- Modificar `src/components/checkout/PaymentMethodsGroup.tsx`:
    - Asegurar que cada manejador de pago (`payMercado`, `payDlocal`, `payBinance`, etc.) invoque el evento `BUYER_ERRORS_EVENT` si la validación falla.
    - Aplicar una capa visual (opacity o `disabled`) a los botones de selección de método si el formulario no es válido.

### 3. Mensajes de Error y UX
- Actualizar `src/i18n/checkoutUI.ts` (si es necesario) o usar los strings existentes para mostrar el mensaje: "Por favor completa tus datos obligatorios (Nombre, Email, Teléfono + Dirección si es físico)".
- Garantizar que el scroll y el focus automático funcionen correctamente en el primer campo faltante.

### 4. Sincronización de Estado
- Verificar en `src/pages/Checkout.tsx` que la propiedad `isPhysical` de los productos cargados desde el backend se transmita correctamente al componente del formulario.
