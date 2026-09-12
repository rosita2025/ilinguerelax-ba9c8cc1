# Resumen mensual y diario en Pedidos

## Objetivo
Agregar a `/admin/orders` un resumen visible de ventas confirmadas para identificar qué producto gana por mes y qué producto gana hoy.

## Cambios
- Usar la lista unificada de pedidos que ya carga la página, sin crear otra fuente de datos.
- Contar únicamente pedidos con estado de pago confirmado.
- Agrupar por SKU principal para no confundir los upsells con el producto ganador.
- Mostrar una tabla mensual con ventas por producto, ganador del mes y aceptación del upsell de 5,000 Palabras cuando el principal sea Patrones Especiales.
- Mostrar un resumen diario con ventas de hoy y el SKU ganador del día.
- Mantener los filtros, envíos, reintentos y pasarelas sin cambios.

## Detalles técnicos
- Los cálculos se harán en la página a partir de `rows`, respetando la deduplicación existente por número de pedido.
- Las fechas se agruparán con horario de Lima para evitar que una compra nocturna aparezca en el día equivocado.
- El bloque será adaptable a celular y escritorio y se actualizará con el refresco automático actual.

## Verificación
- Confirmar que la página carga sin errores.
- Comprobar que los totales diarios y mensuales solo incluyen pagos confirmados y no duplican pedidos.
