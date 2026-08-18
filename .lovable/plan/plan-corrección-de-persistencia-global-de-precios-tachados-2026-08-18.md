# Plan: Corrección de Persistencia Global de Precios Tachados

El objetivo es asegurar que los precios "Antes (Tachado)" en monedas locales (GBP, EUR, COP, etc.) se guarden correctamente en la base de datos y persistan tras refrescar la pantalla en el panel de administración. Actualmente, aunque el frontend permite editarlos, la función de borde (`manage-products`) no los incluye en el objeto que se envía a la base de datos, lo que causa la pérdida de datos.

## Cambios propuestos

### Backend (Supabase Edge Function)

#### [manage-products]
- Actualizar la interfaz `ProductIn` para incluir `local_compare_at_prices`.
- Modificar la construcción del objeto `row` en la acción `upsert` para extraer, validar y redondear los valores de `local_compare_at_prices` desde el payload recibido.
- Aplicar un redondeo inteligente basado en la moneda (0 decimales para COP, CLP, etc.; 2 para el resto) para mantener la consistencia.

### Frontend (Admin Panel)

#### [AdminProductEdit.tsx]
- Verificar que el envío del formulario incluya el campo `local_compare_at_prices` procesado. (El código actual parece intentarlo, pero la función de borde lo ignora).

## Detalles técnicos

### Estructura de datos en `digital_products`
La columna `local_compare_at_prices` es de tipo `JSONB`. El formato esperado es:
```json
{
  "GBP": 82.00,
  "COP": 198000,
  "MXN": 1600.00
}
```

### Lógica de redondeo en la Edge Function
Se replicará la lógica existente para `local_prices`:
- Monedas sin decimales (COP, ARS, CLP, PYG, CRC, JPY, KRW, INR, UGX): `Math.round(n)`
- Resto: `Math.round(n * 100) / 100`

## Pasos de verificación
1. Editar un producto en el Admin.
2. Establecer un precio tachado en una moneda local (ej. GBP 82).
3. Guardar el producto.
4. Refrescar la página y verificar que el valor 82 permanezca en el campo.
5. Verificar en la tienda pública que el precio tachado sea visible para esa región.
