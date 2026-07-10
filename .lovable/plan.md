## Objetivo

Cambiar la URL del checkout de `/checkouts/prueba-1` a `/checkout/:slug` estilo Shopify, donde el `slug` identifica el producto y se carga automáticamente en el carrito. Ejemplos:

- `/checkout/patrones-ingles` → carga "Patrones Especiales en Inglés" ($8 USD)
- `/checkout/1000-verbos` → carga "1,000 Verbos en Inglés" ($15 USD)
- `/checkout/5000-spanish-words` → carga "5,000 Spanish Words" ($22 USD)
- `/checkout` (sin slug) → muestra carrito actual (mantiene compatibilidad)

## Cambios

### 1. Catálogo central de productos (nuevo archivo)

`src/config/checkoutCatalog.ts` — mapa `slug → PruebaItem`:

```ts
export const CHECKOUT_CATALOG: Record<string, PruebaItem> = {
  "patrones-ingles": {
    id: "patrones-especiales-ingles",
    name: "Patrones Especiales, Alfabeto y Combinaciones Secretas en Inglés (PDF)",
    price: 8,
    image: patronesImg,
    quantity: 1,
  },
  "1000-verbos": { id: "1000-verbos-ingles", name: "1,000 Verbos en Inglés (PDF)", price: 15, ... },
  "5000-spanish-words": { ... $22 ... },
  "patrones-espanol": { id: "patrones-espanol", price: 15, regionPrices: { latam: 10, global: 15 } },
  // se puede extender fácilmente
};
```

### 2. Nueva ruta con slug

`src/App.tsx`:
- Agregar `<Route path="/checkout/:slug?" element={<CheckoutPrueba1 />} />`
- Mantener `/checkouts/prueba-1` como alias (redirige a `/checkout`) para no romper enlaces existentes.

### 3. Auto-carga por slug en `CheckoutPrueba1.tsx`

Al montar la página:
```ts
const { slug } = useParams();
useEffect(() => {
  if (slug && CHECKOUT_CATALOG[slug]) {
    clear();
    addItem(CHECKOUT_CATALOG[slug]);
  }
}, [slug]);
```

Si el slug no existe en el catálogo → mostrar mensaje "Producto no encontrado" con botón volver al home.

### 4. Actualizar páginas de producto

Reemplazar la lógica actual (add manual + navigate) por navegación directa al slug:

- `ProductPatronesEspeciales.tsx` → `navigate("/checkout/patrones-ingles")`
- `Product1000Verbos.tsx` → `navigate("/checkout/1000-verbos")`
- `ProductSpanish5000Digital.tsx` → `navigate("/checkout/5000-spanish-words")`

El carrito se limpia y se carga el producto correcto automáticamente por la URL — igual que Shopify.

### 5. Compatibilidad

- `/checkouts/prueba-1` seguirá funcionando (redirect suave a `/checkout`).
- Los emails de confirmación, páginas success/failure/pending no cambian.
- Las edge functions (`create-checkout`, `create-mercadopago-preference`) siguen recibiendo `line_items` dinámicos — no requieren cambios.

## Ventajas

- URLs limpias y compartibles: `ilinguerelax.com/checkout/patrones-ingles`
- Producto identificado por URL (no depende de estado del carrito).
- Fácil agregar nuevos productos: solo añadir una entrada al catálogo.
- SEO-friendly y trackeable en analytics por slug.

¿Procedo con la implementación?
