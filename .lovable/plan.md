# Plan: Secuencia Drip de Bienvenida (9 correos, día 1 → 120)

## Objetivo
Después de suscribirse al popup (día 0 = cupón NEW10 ya funciona), enviar automáticamente 9 correos programados con temas distintos, en el idioma del suscriptor, sin repetir productos ya comprados y sin chocar con el sistema de carrito abandonado.

## Calendario y temas

| Step | Día | Tema | Contenido principal |
|------|-----|------|---------------------|
| 1 | 1 | **Conoce iLingue Relax** | Presentación de la marca + menú: Home, Productos, Blog, Contacto |
| 2 | 3 | **Mostrar catálogo** | Grid de todos los productos digitales con precios locales |
| 3 | 7 | **Producto estrella: 1,000 Palabras Inglés** | Beneficios + testimonios + CTA compra |
| 4 | 15 | **Producto: 5,000 Palabras Inglés** | Detalle + reseñas + CTA |
| 5 | 30 | **Oferta especial** | Cupón adicional (ej. FRIEND15) por 48h |
| 6 | 40 | **Dolor / problema** | "¿Todavía no hablas inglés fluido?" + solución con producto Patrones Especiales |
| 7 | 60 | **Producto: Coreano 100 Mapas Mentales** | Presentación + testimonios WhatsApp |
| 8 | 90 | **Testimonios + reseñas** | Compradores reales + CTA productos |
| 9 | 120 | **Última oportunidad / VIP** | Cupón final + invitación a suscribirse a la tienda |

## Reglas de envío

1. **Un correo por día máximo**: si el usuario ya recibió cualquier email (drip, abandono, digital) en las últimas 24h → se salta ese día y reintenta al siguiente cron.
2. **Anti-duplicado**: tabla `newsletter_drip_sends` con `unique(email, step)`. Se hace claim atómico antes de enviar.
3. **Producto ya comprado**: cada correo que promociona un producto específico verifica ownership (helper `purchasedSkus.ts`); si ya lo compró, se sustituye por el siguiente producto no comprado o se salta el step.
4. **Colisión con abandono al carrito**: si hay un carrito abandonado activo (últimas 72h) → el drip espera un día. El abandono tiene prioridad porque es más urgente/comercial.
5. **Baja / suppression**: respeta `suppressed_emails`, `email_contacts.unsubscribed` y `marketing_opt_in`.
6. **Idioma**: usa el `language` guardado en `email_contacts` al momento de suscribirse (fallback a ES).

## Cambios técnicos

### 1. Base de datos (migración)
- Nueva tabla `newsletter_drip_sends`:
  - `id`, `email` (lower), `step` int, `status` (pending/sent/skipped/failed), `sent_at`, `error`, `metadata`
  - `unique (email, step)` para claim atómico
- Nueva tabla `newsletter_drip_config` (una fila por step, editable desde admin):
  - `step`, `day_offset`, `subject_key`, `enabled`, `product_sku` (opcional para skip si comprado)
- Asegurar que `email_contacts` con `source='newsletter_welcome'` tiene columna `created_at` (ya existe) para calcular offset de días.

### 2. Edge Function nueva: `send-newsletter-drip`
- Cron cada 6 horas.
- Query: suscriptores en `email_contacts` con `source='newsletter_welcome'`, calcula `days_since = now() - created_at`.
- Para cada step cuyo `day_offset <= days_since` y que aún no tiene registro `sent` en `newsletter_drip_sends`:
  - Claim atómico (insert con `ignoreDuplicates`).
  - Chequeos: 24h throttle global, suppression, carrito abandonado activo, producto ya comprado.
  - Renderiza template en idioma del contacto.
  - Envía vía `sendEmail` (Brevo).
  - Marca `sent` con timestamp.

### 3. Templates
- Archivo `_shared/drip-templates/` con 9 archivos, cada uno exporta `{ subject, html, text }` por idioma.
- Traducciones para: ES, EN, FR, PT, DE, IT, NL, JA, KO, ZH, RU, AR, HI, TR (mismo mapa que `subscribe-newsletter`).
- Footer con link de baja (unsubscribe).

### 4. Cron
- Programar `send-newsletter-drip` cada 6h vía pg_cron.

### 5. Admin (opcional, no bloqueante)
- Página `/admin/newsletter-drip`: ver progreso por suscriptor, pausar/reanudar step, ver estadísticas de apertura/click (si Brevo devuelve).

## Orden de implementación
1. Migración de tablas + seed de config.
2. Edge function `send-newsletter-drip` con templates ES/EN primero.
3. Cron scheduling.
4. Añadir resto de idiomas.
5. (Opcional) Panel admin.

## Notas de seguridad
- La función usa `SUPABASE_SERVICE_ROLE_KEY` internamente.
- Rate-limit por Brevo respetado (batch de 50 por corrida).
- Idempotencia por `(email, step)` garantiza que un cron duplicado no reenvía.
