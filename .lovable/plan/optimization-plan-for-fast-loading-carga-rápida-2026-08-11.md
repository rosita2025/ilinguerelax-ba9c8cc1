# Optimization Plan for Fast Loading ("Carga Rápida")

The objective is to improve the performance metrics (LCP, TBT, CLS) by optimizing asset delivery, script execution, and bundle size.

## 1. Vite Configuration Optimization
- Implement **Manual Chunking** in `vite.config.ts`.
- Split large dependencies like `lucide-react`, `framer-motion`, `@tanstack/react-query`, and `swiper` into separate chunks.
- This allows the browser to cache these libraries separately and reduces the size of the main entry bundle.

## 2. Critical Asset Preloading
- Add a `<link rel="preload">` for the Hero background image (`src/assets/hero-bg.jpg`) in `index.html`.
- This ensures the Largest Contentful Paint (LCP) element starts downloading as soon as the HTML is parsed.

## 3. Script Loading Optimization
- Modify `index.html` to delay the execution of non-critical third-party scripts (Google Tag Manager, Meta Pixel, TikTok Pixel).
- Use `setTimeout` or `requestIdleCallback` to initialize these after the main page has rendered.

## 4. Component-Level Performance
- **Hero.tsx**: Explicitly set `loading="eager"` and `fetchpriority="high"` for the background image.
- **Image Tags**: Ensure `decoding="async"` is used consistently for all non-LCP images to prevent thread blocking.
- **Lazy Loading**: Verify that below-the-fold components like `AllProductsReviews` or `AboutMe` are using `loading="lazy"` for their images.

## 5. Global Styles & Fallbacks
- Ensure the `PageFallback` in `App.tsx` is minimal and doesn't trigger heavy CSS re-calculations.
- Optimize the `index.css` to remove any unused animations or heavy filters from initial view.

## 6. Verification
- Use Lighthouse (simulated via shell if possible or via observation of bundle sizes).
- Monitor `LCP` and `FCP` improvements.
