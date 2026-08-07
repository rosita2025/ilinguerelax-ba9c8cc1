---
name: Automatización de drive_url a Token y Refuerzo de Seguridad
description: Implementa la generación automática de tokens de descarga al guardar productos y asegura que la entrega digital use estrictamente estos tokens, sin exponer enlaces de Drive a las pasarelas de pago.
type: feature
---

# Plan de Automatización y Seguridad de Descargas

## 1. Modificación de `manage-products` Edge Function
Actualizar `supabase/functions/manage-products/index.ts` para:
- **Validación Estricta**: Mantener la política de que el `drive_url` debe ser un enlace válido de Google Drive.
- **Normalización**: Asegurar que las URLs se guarden normalizadas (usando la lógica de `src/lib/googleDrive.ts` pero en el backend).

## 2. Refuerzo de la Política de Entrega
Asegurar que **ninguna** pasarela de pago (Stripe, Mercado Pago, dLocal Go, PayPal, Yape/Plin, SPEI) reciba el `drive_url` directamente.
- Los webhooks de pago deben invocar `order-delivery` o `create-download-token`.
- `order-delivery` genera el enlace `/mi-descarga?t=<token>`.
- El cliente recibe este enlace por correo, nunca el de Drive.

## 3. Lógica de "drive_url a Token"
En el contexto del usuario, "automatizar drive url a token" significa que el sistema debe gestionar la relación de forma que el admin solo se preocupe del `drive_url`, y el sistema se encargue de "tokenizarlo" para el cliente final.
- Confirmar que `create-download-token` y `order-delivery` están usando el `drive_url` actualizado de la tabla `digital_products` en tiempo real.

## 4. Verificación de Seguridad
- Revisar que en `src/pages/Checkout.tsx` y las funciones de creación de pagos no se esté filtrando el `drive_url` en los metadatos de las pasarelas (Stripe, etc).
- Validar que el sistema de tokens (`public.download_tokens`) es el único punto de acceso al material.

## 5. Implementación de Cambios
- **Backend**: Mejorar `manage-products` para incluir la normalización de URLs que ya tenemos en el frontend.
- **Frontend**: Asegurar que el Admin vea claramente que el producto está "protegido por token".
