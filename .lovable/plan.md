# Plan: Explicación de Pagos en USD con Conversión Local

El usuario solicita una explicación sobre cómo funcionan dLocal Go y Stripe en el sistema actual, específicamente respecto al uso de Dólares (USD) y la conversión automática a moneda local.

## Análisis
Basado en los cambios previos realizados en el proyecto (Edge Functions y componentes de frontend):
1.  **Stripe**: Se configuró para procesar siempre en `USD`. El banco del cliente realiza la conversión final a moneda local en su estado de cuenta.
2.  **dLocal Go**: Se configuró con `startCurrency: "USD"`. dLocal actúa como el procesador que muestra al usuario el monto equivalente en su moneda local (MXN, COP, BRL, etc.) para métodos de efectivo o transferencia, pero la base de la transacción para el comercio es USD.
3.  **Interfaz (Checkout)**: El sistema detecta cuando se selecciona un método global (Stripe, dLocal, PayPal) y actualiza el resumen del pedido para mostrar USD, garantizando que el cliente sepa exactamente cuánto se le está cobrando.

## Acciones realizadas
- Se ha creado una memoria detallada en `mem://features/unified-usd-payment-logic.md` que documenta este comportamiento para futuras referencias.
- Se ha actualizado el índice de memoria del proyecto.

## Respuesta al Usuario
Explicaré que dLocal Go y Stripe ahora operan en USD para evitar fallos regionales, permitiendo que los proveedores o bancos manejen la conversión local de forma transparente para el cliente.
