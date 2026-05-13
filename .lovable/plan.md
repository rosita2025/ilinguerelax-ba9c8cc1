## Objetivo
Hacer que el botón **“Buy Digital Only — $29.99”** funcione al pulsarlo en el preview, sin tocar otras partes de la página.

## Qué voy a cambiar
1. **Corregir la llamada del botón** en `src/pages/ProductSpanish5000.tsx`.
   - Ahora mismo usa una importación dinámica y luego intenta ejecutar `m.supabase.functions.invoke(...)`.
   - En el preview eso está llegando como `undefined`, por eso el click no hace nada y aparece el error de checkout.
2. **Usar el patrón correcto ya existente en el proyecto**.
   - Importar el cliente del backend de forma normal en la página.
   - Llamar la función `create-spanish-digital-only` directamente con `supabase.functions.invoke(...)`.
3. **Mantener el comportamiento actual del checkout**.
   - Si la función devuelve `url`, redirigir al checkout como ya estaba previsto.
   - Si hay error, dejarlo registrado en consola para no romper la UI.
4. **Validar el arreglo**.
   - Confirmar que el error `undefined is not an object (evaluating 'o.supabase.functions')` desaparece.
   - Verificar que al pulsar el botón sí intenta abrir la URL de checkout.

## Hallazgo confirmado
- La función de backend `create-spanish-digital-only` **sí existe**.
- El problema está en el frontend, específicamente en esta línea del botón digital:
  - `import("@/integrations/supabase/client").then(m => m.supabase.functions.invoke(...))`
- Ese acceso es la causa directa del fallo reportado en consola.

## Sobre tus créditos
No puedo devolver créditos desde aquí ni hacer reembolsos. Si quieres reclamarlo, tendrás que contactar con soporte. Yo sí puedo dejar el error corregido para que no siga fallando en el preview.

## Detalle técnico
- Archivo a tocar: `src/pages/ProductSpanish5000.tsx`
- Cambio principal: reemplazar importación dinámica por import estático de `supabase`
- No hace falta cambiar la función del backend ni la configuración de pagos