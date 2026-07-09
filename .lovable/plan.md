
# Checkout tipo Shopify — "Prueba 1"

Nueva página de prueba en `/checkouts` con diseño idéntico al checkout de Shopify (referencia adjuntada), 100% aislada — **no toca ningún producto existente** (Hotmart, Shopify, digital $22, coreano, patrones, etc.). Solo usa Stripe.

## Alcance

- Producto de prueba llamado **"Prueba 1"** con carrito multi-item editable (agregar, quitar, cambiar cantidad).
- Layout 2 columnas desktop / 1 columna mobile con panel de resumen colapsable.
- Express checkout arriba: Google Pay, Apple Pay, PayPal (aparecen automáticamente en Stripe).
- Formulario: email, teléfono, nombre, apellido, país (auto-detectado por IP).
- Cupón de descuento (compatible con `NEW10`).
- Métodos de pago: tarjetas crédito/débito + wallets nativas de Stripe.
- Estilo visual: paleta del proyecto (Teal `hsl(175 65% 40%)`, Coral, Plus Jakarta Sans) + estructura Shopify.

## Diseño de la página

```text
Desktop (2 columnas):
┌──────────────────────────────────┬───────────────────────┐
│  ILINGUE RELAX                   │   Tu pedido           │
│                                  │                       │
│  ── Express checkout ──          │  [img] Prueba 1 · $X  │
│  [Google Pay] [Apple Pay]        │  [img] Item 2  · $Y  │
│  [    PayPal          ]          │  [img] Item 3  · $Z  │
│                                  │                       │
│  ─── O paga con tarjeta ───      │  Cupón [_____] Aplicar│
│                                  │  ─────────────────    │
│  Contacto                        │  Subtotal      $XX    │
│  [email____________]             │  Descuento     -$X    │
│  [teléfono_________]             │  Impuestos     incl.  │
│                                  │  ═════════════════    │
│  Datos                           │  Total         $XX    │
│  [nombre] [apellido]             │                       │
│  [país ▼ auto-IP]                │                       │
│                                  │                       │
│  [   Pagar $XX  →   ]            │                       │
│  Pago 100% seguro · SSL          │                       │
└──────────────────────────────────┴───────────────────────┘

Mobile (1 columna):
┌────────────────────────┐
│ ILINGUE RELAX          │
│ ▼ Ver resumen · $XX    │  ← desplegable
├────────────────────────┤
│ [wallets express]      │
│ [formulario]           │
│ [Pagar $XX →]          │
└────────────────────────┘
```

## Archivos a crear

- `src/pages/CheckoutPrueba1.tsx` — página principal del checkout multi-item.
- `src/components/checkout/OrderSummary.tsx` — panel derecho con lista de items + cupón + totales.
- `src/components/checkout/ExpressCheckoutButtons.tsx` — wallets (Google/Apple Pay/PayPal) usando `<ExpressCheckoutElement>` de Stripe.
- `src/components/checkout/ContactForm.tsx` — formulario con `react-hook-form` + validación `zod`.
- `src/stores/checkoutPruebaStore.ts` — zustand store con items, cantidades, cupón (aislado del `cartStore` existente).
- `supabase/functions/create-checkout-prueba/index.ts` — crea Stripe Checkout Session con `line_items` dinámicos + metadata (nombre, teléfono, país, cupón).

## Archivos a modificar (mínimo)

- `src/App.tsx` — añadir ruta `/checkouts/prueba-1`. **La ruta actual `/checkouts` (CheckoutTest) queda intacta.**
- `supabase/config.toml` — registrar `create-checkout-prueba` con `verify_jwt = false`.

## Datos capturados

Formulario valida con zod:

- `email` — obligatorio, formato email, ≤255 chars
- `phone` — obligatorio, formato internacional (`+51 999 999 999`)
- `firstName` / `lastName` — obligatorios, ≤50 chars c/u
- `country` — auto por IP (ipapi.co) + selector manual

Todo va en `session.metadata` de Stripe y se guarda en `email_contacts` vía webhook `payments-webhook`.

## Métodos de pago activos

Stripe Embedded Checkout maneja automáticamente:

- Tarjetas Visa/Mastercard/Amex/Discover
- Google Pay (Chrome/Android con tarjeta guardada)
- Apple Pay (Safari/iOS)
- Link (autofill Stripe)
- **PayPal** — el usuario lo activa una vez en Stripe Dashboard → Settings → Payment methods → PayPal → Turn on

**No incluye** métodos LatAm (PSE, Nequi, Yape) — eso será una fase posterior con Wompi/Mercado Pago.

## Backend flow

```text
Cliente edita carrito → click "Pagar"
   ↓
create-checkout-prueba (edge function):
   - valida body con zod
   - construye line_items dinámicos con price_data
   - aplica cupón NEW10 si viene en body (10% off)
   - metadata: { source: "prueba-1", name, phone, country, items }
   - return_url: /checkouts/return?session_id={CHECKOUT_SESSION_ID}
   ↓
Stripe Embedded Checkout se monta inline
   ↓
Pago exitoso → return page /checkouts/return (ya existe)
   ↓
Webhook payments-webhook (ya existe) guarda contacto
```

## Detalles técnicos

- `<EmbeddedCheckoutProvider>` de `@stripe/react-stripe-js` (ya instalado).
- Item schema: `{ id, name, price, quantity, image }`. Pruebas1 arranca con 3 items demo editables.
- Cupón `NEW10` aplica 10% al subtotal (mismo comportamiento que popups actuales).
- Trust badges pie: SSL Stripe, garantía 30 días, soporte WhatsApp.
- Banner `PaymentTestModeBanner` visible mientras `pk_test_...` esté activo.
- Detección país: usa `getCountryFromIP()` existente si está disponible; fallback a `ipapi.co` (ya usado en el proyecto).

## Fuera de alcance (fases futuras)

- Wompi (Colombia — PSE/Nequi/Efecty)
- Mercado Pago (Perú/Chile/Argentina/Ecuador)
- Router `<SmartCheckout />` que decide procesador por país
- Reemplazar checkouts de productos reales
