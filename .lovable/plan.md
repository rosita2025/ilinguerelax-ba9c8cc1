# Protección durante los 7 días de reembolso Hotmart

## Objetivo
Durante los primeros 7 días desde la compra (ventana de reembolso Hotmart), el cliente **solo puede ver** el PDF en pantalla con marca de agua (su email + fecha), **sin botón de descarga ni imprimir**. Pasados los 7 días, se desbloquean los botones de descarga e impresión.

## Cómo funcionará (vista del cliente)

1. Hotmart envía al cliente un correo con:
   - Enlace a `/descarga/coreano-100-mapas`
   - Su **email de compra** y **ID de pedido Hotmart** (transaction code)
2. En la página, el cliente ingresa `email` + `ID de pedido` (reemplaza la clave `123456` genérica).
3. Backend valida contra la tabla de compras registradas por Hotmart.
4. Según los días transcurridos:
   - **Días 0–7**: modo *previsualización*. Se muestra el PDF con `react-pdf` en un visor, con marca de agua diagonal repetida (email del comprador + fecha). Sin botones de descarga ni imprimir; atajos Ctrl+P / clic derecho bloqueados por CSS/JS.
   - **Día 8 en adelante**: se muestra un cartel "Ya finalizó tu período de reembolso — ahora puedes descargar e imprimir libremente" con los 3 botones (PDF principal + 2 bonos).

## Cómo se registra la compra
- Edge function `hotmart-purchase-webhook` (nueva). Hotmart la llama al aprobar la compra.
- Guarda en tabla `hotmart_purchases`: `email`, `transaction_code`, `product_code`, `purchased_at`, `status` (approved / refunded / cancelled).
- Si Hotmart notifica reembolso o chargeback, se marca `refunded` y el acceso queda bloqueado permanentemente.

## Cómo se valida el acceso
- Edge function `verify-coreano-access`. Recibe `email` + `transaction_code`, devuelve:
  - `status`: `preview_only` (< 7 días), `full_access` (≥ 7 días), `refunded`, `not_found`.
  - Un **token firmado de corta duración** (JWT propio, 30 min) que la página usa para pedir el PDF con marca de agua o los archivos completos.
- El PDF de previsualización se genera al vuelo desde el edge function con `pdf-lib`, aplicando marca de agua con el email del comprador en cada página. El PDF original nunca sale del servidor durante los 7 días.

## Limitaciones honestas
- Nada evita capturas de pantalla o grabación de pantalla — pero la **marca de agua con email** disuade fuertemente porque cualquier fuga se rastrea al comprador.
- Ctrl+P y "guardar como" desde el visor se bloquean, pero un usuario técnico puede sortearlo con DevTools. El sistema cubre al 95 %+ de compradores reales.
- Requiere que Hotmart envíe el `transaction_code` al comprador (ya lo hace por defecto en el email de confirmación).

## Detalles técnicos

**Nueva tabla `hotmart_purchases`** (RLS habilitado, solo edge functions con service role):
```
id, email (citext), transaction_code (unique), product_code,
purchased_at, refund_deadline (purchased_at + 7 días),
status ('approved'|'refunded'|'cancelled'|'chargeback'),
created_at, updated_at
```

**Nuevas edge functions:**
- `hotmart-purchase-webhook`: recibe eventos `PURCHASE_APPROVED`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK` y actualiza la tabla. Valida `HOTMART_WEBHOOK_TOKEN`.
- `verify-coreano-access`: valida email + transaction_code, devuelve estado + JWT firmado.
- `serve-coreano-preview`: recibe el JWT, devuelve el PDF con marca de agua (solo durante los 7 días).

**Cambios en `src/pages/DescargaCoreano.tsx`:**
- Reemplazar el formulario de clave por dos campos: email + transaction_code.
- Añadir visor `react-pdf` para modo previsualización, con `sandbox` y sin controles de descarga.
- Mostrar los 3 botones de descarga solo cuando `status === 'full_access'`.
- Bloqueos front-end: `oncontextmenu`, `@media print { body { display: none } }`, listeners para Ctrl+P / Ctrl+S.

**Secrets requeridos:**
- `HOTMART_WEBHOOK_TOKEN` (te lo da Hotmart al configurar el webhook).
- `COREANO_ACCESS_JWT_SECRET` (se genera automáticamente).

## Configuración manual que necesitarás hacer tú en Hotmart
1. Ir a Hotmart → Herramientas → Webhooks (Postback).
2. Añadir la URL del webhook que te daré tras desplegar la edge function.
3. Activar los eventos: `PURCHASE_APPROVED`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_CANCELED`.
4. Copiar el token de Hotmart y pegarlo cuando te pida `HOTMART_WEBHOOK_TOKEN`.
5. Ajustar el email de confirmación de Hotmart para que incluya al comprador: su email, el `transaction_code` y el enlace `/descarga/coreano-100-mapas`.

## Fuera de alcance (podemos hacerlo después)
- DRM real tipo Adobe / Locklizard (requiere servicio externo de pago).
- Bloqueo por cantidad de dispositivos o IP.
- Expiración total del acceso pasado X tiempo.
