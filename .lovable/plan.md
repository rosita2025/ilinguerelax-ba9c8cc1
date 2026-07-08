# Plan de optimización SEO – iLingue Relax

Basado en la auditoría real del sitio (Lighthouse + agentes SEO + Google Search Console). Priorizado por impacto: primero lo que arregla lo que está roto hoy, después mejoras estructurales, y al final el link building.

## Fase 1 · Fixes técnicos detectados por el escáner (impacto directo)

**1. Sitemap desactualizado** (`public/sitemap.xml`)
Faltan estas rutas reales del sitio:
- `/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles`
- `/products/100-mapas-mentales-para-aprender-coreano-hangul-c1`
- `/products/estructuras-gramaticales-ingles-a1-c1`
- `/descarga/coreano-100-mapas`
- `/vista-previa/patrones-especiales`
- `/vista-previa/coreano-100-mapas-mentales`

Además hay que revisar que todas las rutas activas en `src/App.tsx` estén, y quitar las obsoletas. Se mantiene el archivo estático (no se migra a generador sin confirmar).

**2. Múltiples H1 en el mismo documento**
- `src/pages/BlogPost.tsx` → el markdown convierte `#` a `<h1>` dentro del post, además del H1 del título. Cambiar renderer para mapear `#` a `<h2>`.
- `src/pages/BlogPost.tsx` → "Recursos Recomendados" pasa de `<h3>` a `<h2>` para jerarquía correcta.

**3. Alt text genérico o corto en imágenes**
- `src/pages/Index.tsx` → alt del ticker de logos: "Amazon" → "Amazon partner store", etc.
- `src/pages/Product5000.tsx` → previews cambian de una palabra a frase descriptiva ("Vocabulario" → "Vista previa vocabulario inglés").

**4. Meta titles y descriptions demasiado largos**
- Producto 5000 palabras y 8000 palabras: `<title>` >60 chars → recortar.
- Descriptions >160 chars → reescribir dentro del rango 50–160.

**5. LCP lento (Lighthouse Performance)**
- En cada hero (Home, productos principales) la imagen LCP recibe `width`, `height`, `fetchpriority="high"` y se le quita `loading="lazy"`.
- Fuente Plus Jakarta Sans ya tiene `preload` — añadir `font-display: swap` si falta.

**6. Contraste bajo (Lighthouse Accessibility)**
- Reemplazar utilidades arbitrarias `text-gray-300/400`, `text-muted-foreground/50` por tokens semánticos (`text-foreground`, `text-muted-foreground` sin opacidad) donde el contraste falla.

## Fase 2 · Canonical y OG por página (react-helmet-async)

El componente `SEO` ya usa Helmet. Auditar en cada `Product*.tsx` que:
- `canonicalUrl` apunta a la URL real de esa ruta (no a `/`).
- `og:url` = canonical.
- `og:image` absoluta con `https://ilinguerelax.com/...` (no rutas relativas).

Se corrigen las páginas donde `canonical` u `og:url` apunten a otra ruta.

## Fase 3 · Datos estructurados (JSON-LD) por página

Hoy en `index.html` hay Organization, WebSite, FAQPage, BreadcrumbList y un Product hardcodeado (solo del producto 5000). Se mueve a **por ruta** vía Helmet:

- **Product pages** (todos los `/products/*`): schema `Product` con `name`, `image`, `offers.price`, `offers.priceCurrency`, `aggregateRating` real, `brand`.
- **BlogPost**: schema `Article` con `headline`, `datePublished`, `author`, `image`.
- **Blog index**: `Blog` schema con `blogPost[]`.
- **FAQ pages**: `FAQPage` schema con las preguntas reales de la página, no las del index.
- **Breadcrumbs**: `BreadcrumbList` por ruta profunda.

Se quita el `Product` hardcodeado global de `index.html` para no duplicar señales.

## Fase 4 · URLs y navegación interna

- URLs ya son amigables (`/products/nombre-largo-descriptivo`) — no se cambian para no romper indexación.
- **Enlaces internos**: cada página de producto enlaza a 2–3 productos relacionados por idioma/nivel (cross-sell ya existe, se asegura `<a href>` real, no solo botones onClick).
- Blog posts añaden enlaces internos a la página del producto que mencionan.
- Footer con navegación por categorías (Idiomas, Libros físicos, Libros digitales, Blog) usando `<Link>` real.
- Breadcrumbs visibles en producto y blog (además del schema).

## Fase 5 · Rendimiento / Core Web Vitals

- Todas las imágenes no-hero con `loading="lazy"` + `decoding="async"` + `width`/`height` explícitos para evitar CLS.
- Componentes pesados en productos (`ProductReviews`, `FAQ`, `CustomerReviewsCarousel`) con `lazy()` + `Suspense` (ya se hace en algunos, se extiende).
- Revisar `preconnect` en `index.html` — ya está para fonts y Facebook; añadir para Hotmart si es el destino de compra.

## Fase 6 · Accesibilidad transversal

- Botones con solo ícono (Navbar, Cart) reciben `aria-label`.
- Un solo `<main>` por ruta (auditar `pages/*` — algunos envuelven dos veces).
- Foco visible en todos los interactivos (usar tokens shadcn, no `outline:none`).
- Verificar tap targets ≥44px en móvil (bottom bar, WhatsApp, ScrollToTop).

## Fase 7 · robots.txt y Google Search Console

- `public/robots.txt`: verificar que permite `/`, bloquea `/admin/*`, y declara `Sitemap: https://ilinguerelax.com/sitemap.xml`.
- **Google Search Console no está conectado** — se pide al usuario autorizar el conector en un paso separado (no se puede hacer sin su OAuth). Después se sube el sitemap desde GSC.

## Fase 8 · Marcado de findings como fixed

Después de aplicar cada fix, se marcan como `fixed` en el escáner SEO para que la próxima corrida los verifique.

---

## Fuera de alcance de esta implementación

- **Link building externo** (backlinks desde otros sitios): es trabajo de marketing/outreach, no de código. Puedo generar una lista de tácticas y objetivos pero no se implementa en el repo.
- **Google Search Console**: requiere OAuth del dueño del dominio. Se pide en su propio turno.
- **SSR / previews sociales exactas por ruta**: el stack actual es SPA Vite. Helmet cubre Googlebot; Facebook/LinkedIn ven solo `index.html`. Migrar a SSR es un proyecto aparte — no incluido.

## Detalles técnicos

- Stack: React 18 + Vite + React Router + react-helmet-async (ya instalado).
- Escáner: Lighthouse + agentes internos + GSC (pendiente conectar).
- Findings actuales: 6 (2 low, 4 mid). Fase 1 los resuelve todos menos GSC.
- No se migra el sitemap de estático a generador sin confirmación explícita del usuario.

## Confirmación

¿Procedo con **Fase 1–6 completa** en este turno? La Fase 7 (GSC) queda para cuando autorices el conector, y el link building externo queda como lista de recomendaciones sin código.
