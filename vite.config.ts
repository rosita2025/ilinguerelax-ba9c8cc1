import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), mode === "production" && asyncMainCss()].filter(Boolean),
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
