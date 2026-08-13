# Plan - Unified Physical + Digital Bundle Experience

Improve the physical book product pages to offer a unified "Physical Book + Digital Free" experience, ensuring users understand they receive immediate digital access while their physical book is being shipped.

## User Review
- The user wants to "juntar el digital gratis" (join the free digital) to the physical book products (5,000 words, 8,000 words, and Spanish 5,000 words).
- This involves clarifying that the digital version is included for free and providing the digital download link/access upon purchase.

## Proposed Changes

### Physical Book Pages
- **src/pages/Product5000Book.tsx**, **src/pages/Product8000Book.tsx**, **src/pages/ProductSpanish5000.tsx**
    - Update headings and hero sections to emphasize "Libro Físico + Digital GRATIS".
    - Add a dedicated section or badge explaining the "Acceso Inmediato" (Immediate Access) to the digital version.
    - Ensure the "What's Included" list explicitly mentions the Digital PDF.

### Checkout & Delivery
- **supabase/functions/create-physical-checkout/index.ts**
    - Ensure metadata passed to Stripe includes flags for digital delivery.
- **src/components/PhysicalBookCheckout.tsx**
    - Update the summary sidebar to include a "Digital Gratis" item.

### Order Success & Status
- **src/pages/CheckoutSuccess.tsx** / **src/pages/OrderStatus.tsx**
    - Ensure that for physical book orders, the digital download link is also displayed prominently.
    - Add a message: "Tu libro físico está en camino, pero puedes empezar a estudiar ahora mismo con la versión digital."

## Technical Details
- The digital product IDs are already defined in `src/data/products.ts`.
- Physical products in `create-physical-checkout` are: `english_5000`, `english_8000`, `spanish_5000`.
- We will link these to their digital counterparts:
    - `english_5000` -> `5000` (Digital)
    - `english_8000` -> `8000` (Digital)
    - `spanish_5000` -> `spanish-5000-digital` (Digital)
