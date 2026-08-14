# Plan de Optimización de Precios en el Admin

Añadir visibilidad del valor base en dólares (USD) y la conversión automática en tiempo real dentro de la sección de "Precios exactos por moneda" en el administrador. Esto ayudará a evitar errores al fijar montos manuales.

## Cambios propuestos

### Frontend

#### Admin (Edición de Productos)
- Modificar `src/pages/AdminProductEdit.tsx` para:
    - Incluir el valor de referencia en USD debajo de cada casilla de moneda local.
    - Actualizar el botón de sugerencia para que muestre el cálculo: `(Ref: $XX.XX USD → Sug: YY.YY)`.
    - Añadir un tooltip o indicador visual que muestre la tasa de cambio utilizada para esa sugerencia específica.

### Detalles técnicos
- Utilizar el objeto `exchangeRates` ya disponible en el componente para realizar los cálculos de referencia.
- Mantener la lógica de redondeo "bonito" existente para las sugerencias.
- Asegurar que la interfaz se mantenga limpia y no se sature de información en dispositivos móviles.

## Verificación
- Abrir un producto en `/admin/products/:sku`.
- Verificar que aparezca la referencia en USD debajo de las casillas de MXN, COP, ARS, etc.
- Confirmar que al cambiar el precio base del producto, las referencias y sugerencias se actualicen inmediatamente.
