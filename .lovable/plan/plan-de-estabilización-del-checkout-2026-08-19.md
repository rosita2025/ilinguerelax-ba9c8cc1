# Plan de Estabilización del Checkout

El objetivo es corregir los re-renderizados infinitos y la inestabilidad del formulario de `/checkout/:sku` que causan pantallas blancas al escribir datos.

## Cambios propuestos

### Frontend: Estabilización de `BuyerInfoForm.tsx` e inputs

- **Debouncing de persistencia y tracking**: Actualmente, `useEffect` en `BuyerInfoForm` persiste en `localStorage` y dispara `trackAbandonedCheckoutNow` en cada pulsación. Se implementará un debounce de 2 segundos para estas acciones.
- **Optimización de inputs**: Se mantendrá un estado local para los inputs (`name`, `email`, `address`, etc.) y se sincronizará con el store global (`zustand`) únicamente `onBlur` o con un debounce largo, evitando que cada tecla provoque un re-renderizado completo de `OrderSummary` y `PaymentMethodsGroup` (que realizan cálculos pesados de precios y conversiones).
- **Memoización de validaciones**: Se envolverán las funciones de validación y handlers con `useMemo` y `useCallback` para evitar recreaciones innecesarias en cada ciclo de render.

### Frontend: Blindaje en `Checkout.tsx` y componentes relacionados

- **Error Boundaries locales**: Se reforzarán los `SectionErrorBoundary` alrededor de los componentes críticos (`BuyerInfoForm`, `OrderSummary`, `PaymentMethodsGroup`) para capturar errores de variables 'undefined' o fallos en el cálculo de impuestos sin romper toda la página.
- **Protección de cálculos**: Se añadirán salvaguardas (null-checks) en `calcTotals` y `sumItemsLocal` para manejar casos donde los precios o las tasas de cambio no se hayan cargado correctamente desde el backend.
- **Prevención de bucles en `PaymentMethodsGroup`**: Se revisarán los `useEffect` que gestionan los métodos de pago (Stripe, dLocal) para asegurar que no se disparen cíclicamente al actualizarse el estado del comprador.

## Detalles técnicos

- **Debounce de inputs**: Uso de `useState` local + `useEffect` con timer para actualizar el store global.
- **Validación robusta**: Refactorizar `isBuyerValid` para que sea tolerante a campos faltantes durante la escritura.
- **Control de re-renders**: Aplicar `React.memo` a los subcomponentes del checkout que no dependen directamente del texto escrito (ej. testimonios, logos de pago).

## Verificación

- **Prueba de escritura rápida**: Validar que escribir 60 palabras por minuto en el campo de Nombre no degrade el rendimiento ni bloquee la UI.
- **Simulación de errores**: Forzar valores `null` en el catálogo y verificar que el Error Boundary muestre un estado de carga o error amigable en lugar de una pantalla blanca.
- **Inspección de renders**: Usar React DevTools para confirmar que la escritura en inputs no dispara re-renders en el componente de Stripe/PayPal.

He detectado que el checkout se satura porque cada letra escrita activa el tracking de carritos abandonados y la persistencia local; aplicaré un sistema de entrada optimizado para mantener la fluidez total.
