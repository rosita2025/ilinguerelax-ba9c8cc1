import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { PATRONES_COVER_SOURCE, PATRONES_FAST_COVER_URL, PATRONES_PRODUCT_SLUG } from "./src/lib/patronesCover";

// Start the actual cover request while HTML is parsed, before React or the catalog.
// No other product downloads this image. A cached different admin cover is respected.
const patronesCoverPreload = () => ({
  name: "patrones-cover-preload",
  transformIndexHtml(html: string) {
    const script = `<script>(function(){if(location.pathname!==${JSON.stringify(`/products/${PATRONES_PRODUCT_SLUG}`)})return;try{var c=localStorage.getItem(${JSON.stringify(`ilr_cover_${PATRONES_PRODUCT_SLUG}`)});if(c&&c!==${JSON.stringify(PATRONES_COVER_SOURCE)})return;}catch(e){}var l=document.createElement('link');l.rel='preload';l.as='image';l.href=${JSON.stringify(PATRONES_FAST_COVER_URL)};l.setAttribute('fetchpriority','high');document.head.appendChild(l);})();</script>`;
    return html.replace("</head>", `${script}</head>`);
  },
});

// El CSS principal deja de bloquear el primer pintado: la pantalla inicial (en index.html) usa estilos
// en línea y el CSS se aplica en cuanto baja. React espera a que el CSS esté listo antes de dibujar.
const asyncMainCss = () => ({
  name: "async-main-css",
  enforce: "post" as const,
  transformIndexHtml(html: string) {
    return html.replace(
      /<link rel="stylesheet"([^>]*?) href="(\/assets\/index-[^"]+\.css)"([^>]*)>/,
      (_m, a, href, b) =>
        `<link rel="stylesheet"${a} href="${href}"${b} media="print" data-async-css onload="this.media='all';window.__cssReady=1;window.dispatchEvent(new Event('ilr-css-ready'))">` +
        `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
    );
  },
});

// Las páginas de producto (la entrada de los anuncios) arrancan a descargar su propio código desde que llega el HTML,
// en paralelo con el JS principal, en lugar de esperar a que éste termine de ejecutarse (ahorra ~1 s en móvil lento).
// Solo se precarga en rutas /products/…; el resto del sitio no descarga nada de más.
const productRoutePreload = () => ({
  name: "product-route-preload",
  enforce: "post" as const,
  transformIndexHtml: {
    order: "post" as const,
    handler(html: string, ctx: { bundle?: Record<string, any> }) {
      const bundle = ctx.bundle;
      if (!bundle) return html;
      const closure = (entryName: string) => {
        const start = Object.values(bundle).find(
          (c: any) => c.type === "chunk" && typeof c.facadeModuleId === "string" && c.facadeModuleId.includes(entryName),
        ) as any;
        if (!start) return [] as string[];
        const seen = new Set<string>();
        const walk = (file: string) => {
          if (seen.has(file)) return;
          const c = bundle[file];
          if (!c || c.type !== "chunk") return;
          seen.add(file);
          for (const i of c.imports ?? []) walk(i);
        };
        walk(start.fileName);
        // Lo que el HTML ya descarga (JS principal, vendors) no se repite: solo el código propio de la página.
        return [...seen].map((f) => `/${f}`).filter((u) => !html.includes(u));
      };
      const patrones = closure("pages/ProductPatronesEspeciales");
      const dynamic = closure("pages/ProductDynamic");
      const home = closure("pages/Index");
      if (!patrones.length && !dynamic.length && !home.length) return html;
      const script =
        `<script>(function(){try{var p=location.pathname;var H=${JSON.stringify(home)};` +
        `if(p==='/'){H.forEach(function(u){var l=document.createElement('link');l.rel='modulepreload';l.href=u;document.head.appendChild(l);});return;}` +
        `if(p.indexOf('/products/')!==0)return;` +
        `var L=p.indexOf('patrones-especiales-alfabeto-combinaciones-secretas-ingles')>-1?${JSON.stringify(patrones)}:${JSON.stringify(dynamic)};` +
        `L.forEach(function(u){var l=document.createElement('link');l.rel='modulepreload';l.href=u;document.head.appendChild(l);});}catch(e){}})();</script>`;
      return html.replace("</head>", `${script}</head>`);
    },
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), patronesCoverPreload(), mode === "production" && asyncMainCss(), mode === "production" && productRoutePreload()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom", "react-helmet-async"],
          "vendor-ui": ["lucide-react", "framer-motion", "clsx", "tailwind-merge"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-utils": ["date-fns", "lodash"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
