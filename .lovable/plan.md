# Plan: Optimizacion de UX y Color en el Checkout

El usuario solicita eliminar el aspecto "gris/desactivado" de los métodos de pago en el checkout (`/checkout/:sku`) cuando el formulario no está completo. Actualmente, se aplica una clase `grayscale` y `opacity-50` que confunde a los clientes, haciéndoles pensar que los métodos no funcionan. Se aplicarán colores vivos y activos desde el inicio, manteniendo la validación funcional (scroll al formulario si no está completo) pero mejorando la percepción visual.

## Cambios propuestos

### Frontend

- **`src/components/checkout/PaymentMethodsGroup.tsx`**:
    - Eliminar las clases `grayscale` y `opacity-50` de los botones de selección de método de pago cuando `!valid`.
    - Asegurar que los íconos y textos mantengan su color natural (teal para íconos, negro/blanco para texto) incluso antes de completar los datos.
    - Mantener la lógica de `requestBuyerInfo()` al hacer clic para guiar al usuario al formulario si intenta seleccionar o pagar sin datos.
    - Mejorar el contraste de las etiquetas informativas sobre los métodos de pago.

- **`src/i18n/checkoutUI.ts`**:
    - Refinar el mensaje de `enableMethods` para que sea más claro y menos "bloqueante" visualmente.

### Pruebas y Verificación

- **Verificación visual**: Comprobar en el preview que al entrar al checkout con el formulario vacío, los métodos de pago (Tarjetas, Transferencias, Yape, etc.) se vean coloridos y "clicables".
- **Verificación funcional**: Confirmar que al hacer clic en un método sin haber llenado el nombre/correo, la página hace scroll suave hacia arriba al formulario y muestra los errores (`requestBuyerInfo`).

## Detalles técnicos

- Se modificará el condicional de clases en el componente `PaymentMethodsGroup` que aplica `!valid && "opacity-50 grayscale cursor-pointer hover:bg-transparent hover:grayscale-0"`.
- Se revisarán los componentes de íconos para asegurar que no dependan de la opacidad del padre para su color primario.
