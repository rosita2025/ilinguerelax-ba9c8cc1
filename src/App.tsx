import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect } from "react";
import { useCartSync } from "@/hooks/useCartSync";
import { I18nProvider } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import { CookieConsent } from "@/components/CookieConsent";
import { BrevoChatToggle } from "@/components/BrevoChatToggle";
import { AutoTranslate } from "@/components/AutoTranslate";

const Products = lazy(() => import("./pages/Products"));
const Product5000 = lazy(() => import("./pages/Product5000"));
const Product8000 = lazy(() => import("./pages/Product8000"));
const Product5000Book = lazy(() => import("./pages/Product5000Book"));
const Product8000Book = lazy(() => import("./pages/Product8000Book"));
const ProductSpanish5000 = lazy(() => import("./pages/ProductSpanish5000"));
const ProductSpanish5000Digital = lazy(() => import("./pages/ProductSpanish5000Digital"));
const ProductSpanish3000VerbsBook = lazy(() => import("./pages/ProductSpanish3000VerbsBook"));
const ProductSpanishGrammarPatterns = lazy(() => import("./pages/ProductSpanishGrammarPatterns"));
const ProductSpanish1000Verbs = lazy(() => import("./pages/ProductSpanish1000Verbs"));
const ProductSpanish500Questions = lazy(() => import("./pages/ProductSpanish500Questions"));
const Product1000Verbos = lazy(() => import("./pages/Product1000Verbos"));
const Product500Preguntas = lazy(() => import("./pages/Product500Preguntas"));
const ProductGerman5000 = lazy(() => import("./pages/ProductGerman5000"));
const ProductPortuguese5000 = lazy(() => import("./pages/ProductPortuguese5000"));
const ProductItalian5000 = lazy(() => import("./pages/ProductItalian5000"));
const ProductFrench5000 = lazy(() => import("./pages/ProductFrench5000"));
const ProductDutch5000 = lazy(() => import("./pages/ProductDutch5000"));

const ProductPatronesEspeciales = lazy(() => import("./pages/ProductPatronesEspeciales"));
const ProductCoreanoRelax = lazy(() => import("./pages/ProductCoreanoRelax"));
const DescargaCoreano = lazy(() => import("./pages/DescargaCoreano"));
const DescargaPatrones = lazy(() => import("./pages/DescargaPatrones"));
const ProductEstructurasGramaticalesIngles = lazy(() => import("./pages/ProductEstructurasGramaticalesIngles"));
const VistaPreviaPatrones = lazy(() => import("./pages/VistaPreviaPatrones"));
const VistaPreviaCoreano = lazy(() => import("./pages/VistaPreviaCoreano"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const HotmartSuccess = lazy(() => import("./pages/HotmartSuccess"));
const HotmartPending = lazy(() => import("./pages/HotmartPending"));
const HotmartCreditPending = lazy(() => import("./pages/HotmartCreditPending"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminFunnel = lazy(() => import("./pages/AdminFunnel"));
const AdminSEO = lazy(() => import("./pages/AdminSEO"));
const AdminShopify = lazy(() => import("./pages/AdminShopify"));
const AdminHome = lazy(() => import("./pages/AdminHome"));
const AdminLive = lazy(() => import("./pages/AdminLive"));
const AdminCheckoutMethods = lazy(() => import("./pages/AdminCheckoutMethods"));

import { AdminGate } from "@/components/admin/AdminGate";
const DejarResena = lazy(() => import("./pages/DejarResena"));
const AmazonRedirect = lazy(() => import("./pages/AmazonRedirect"));
const CheckoutTest = lazy(() => import("./pages/CheckoutTest"));
const CheckoutPrueba1 = lazy(() => import("./pages/CheckoutPrueba1"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutFailure = lazy(() => import("./pages/CheckoutFailure"));
const CheckoutPending = lazy(() => import("./pages/CheckoutPending"));
const CheckoutPendienteManual = lazy(() => import("./pages/CheckoutPendienteManual"));

const queryClient = new QueryClient();

const CartSyncWrapper = ({ children }: { children: React.ReactNode }) => {
  useCartSync();
  return <>{children}</>;
};

const FUNNEL_SESSION_KEY = "ilr_funnel_sid";
const FUNNEL_REF_KEY = "ilr_funnel_ref";
const getSid = () => {
  try {
    let sid = localStorage.getItem(FUNNEL_SESSION_KEY);
    if (!sid) {
      sid = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem(FUNNEL_SESSION_KEY, sid);
    }
    return sid;
  } catch { return "anon"; }
};

const getAttributionReferrer = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    if (utmSource) {
      const ref = `utm:${utmSource}:${params.get("utm_campaign") || ""}`;
      localStorage.setItem(FUNNEL_REF_KEY, ref);
      return ref;
    }
    const saved = localStorage.getItem(FUNNEL_REF_KEY);
    if (saved) return saved;
    const referrer = document.referrer || null;
    if (referrer) {
      const refHost = new URL(referrer).hostname.replace(/^www\./, "");
      const ownHost = window.location.hostname.replace(/^www\./, "");
      if (refHost !== ownHost && !refHost.includes("lovable")) {
        localStorage.setItem(FUNNEL_REF_KEY, referrer);
        return referrer;
      }
    }
  } catch { /* noop */ }
  return null;
};

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    try {
      void supabase.functions.invoke("log-funnel-event", {
        body: {
          event_name: "PageView",
          session_id: getSid(),
          page_path: location.pathname,
          country: localStorage.getItem("ilr_country"),
          referrer: getAttributionReferrer(),
        },
      });
    } catch (_) { /* noop */ }
  }, [location.pathname]);
  return null;
};

const PageFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartSyncWrapper>
              <RouteTracker />
              <AutoTranslate />
              <BrevoChatToggle />
              <CookieConsent />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" element={<Product5000 />} />
                  <Route path="/products/8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa" element={<Product8000 />} />
                  <Route path="/products/5-000-palabras-libro-fisico" element={<Product5000Book />} />
                  <Route path="/products/8-000-palabras-libro-fisico" element={<Product8000Book />} />
                  <Route path="/products/5-000-spanish-words-with-english-pronunciation-physical" element={<ProductSpanish5000 />} />
                  <Route path="/products/5-000-spanish-words-with-english-pronunciation" element={<Navigate to="/products/5-000-spanish-words-with-english-pronunciation-physical" replace />} />
                  <Route path="/products/5-000-spanish-words-with-english-pronunciation-digital" element={<ProductSpanish5000Digital />} />
                  <Route path="/products/3-000-spanish-verbs-mastery-physical-book-preorder" element={<ProductSpanish3000VerbsBook />} />
                  <Route path="/products/spanish-grammar-patterns-a1-c1-mastery-preorder" element={<ProductSpanishGrammarPatterns />} />
                  <Route path="/products/1-000-verbs-in-spanish-past-present-future-with-english-pronunciation" element={<ProductSpanish1000Verbs />} />
                  <Route path="/products/500-questions-in-spanish-with-english-pronunciation" element={<ProductSpanish500Questions />} />
                  <Route path="/products/1-000-verbos-esenciales-en-ingles-presente-pasado-futuro-con-pronunciacion" element={<Product1000Verbos />} />
                  <Route path="/products/500-preguntas-en-ingles-con-pronunciacion-para-hispanohablantes" element={<Product500Preguntas />} />
                  <Route path="/products/5-000-palabras-en-aleman-con-pronunciacion-para-hispanohablantes" element={<ProductGerman5000 />} />
                  <Route path="/products/5-000-palabras-en-portugues-con-pronunciacion-para-hispanohablantes" element={<ProductPortuguese5000 />} />
                  <Route path="/products/5-000-palabras-en-italiano-con-pronunciacion-para-hispanohablantes" element={<ProductItalian5000 />} />
                  <Route path="/products/5-000-palabras-en-frances-con-pronunciacion-para-hispanohablantes" element={<ProductFrench5000 />} />
                  <Route path="/products/5-000-palabras-en-neerlandes-con-pronunciacion-para-hispanohablantes" element={<ProductDutch5000 />} />
                  
                  <Route path="/products/patrones-especiales-alfabeto-combinaciones-secretas-ingles" element={<ProductPatronesEspeciales />} />
                 <Route path="/products/100-mapas-mentales-para-aprender-coreano-hangul-c1" element={<ProductCoreanoRelax />} />
                 <Route path="/descarga/coreano-100-mapas" element={<DescargaCoreano />} />
                 <Route path="/descarga/patrones-ingles" element={<DescargaPatrones />} />
                  <Route path="/products/estructuras-gramaticales-ingles-a1-c1" element={<ProductEstructurasGramaticalesIngles />} />
                  <Route path="/vista-previa/patrones-especiales" element={<VistaPreviaPatrones />} />
                  <Route path="/vista-previa/coreano-100-mapas-mentales" element={<VistaPreviaCoreano />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/hotmart-success" element={<HotmartSuccess />} />
                  <Route path="/hotmart-pending" element={<HotmartPending />} />
                  <Route path="/hotmart-credit-pending" element={<HotmartCreditPending />} />
                  <Route path="/sobre-nosotros" element={<AboutPage />} />
                  <Route path="/contacto" element={<ContactPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/privacidad" element={<PrivacyPage />} />
                  <Route path="/condiciones" element={<TermsPage />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/dejar-resena" element={<DejarResena />} />
                  <Route path="/admin" element={<AdminGate><AdminHome /></AdminGate>} />
                  <Route path="/admin/live" element={<AdminGate><AdminLive /></AdminGate>} />
                  <Route path="/admin/reviews" element={<AdminGate><AdminReviews /></AdminGate>} />
                  <Route path="/admin/funnel" element={<AdminGate><AdminFunnel /></AdminGate>} />
                  <Route path="/admin/seo" element={<AdminGate><AdminSEO /></AdminGate>} />
                  <Route path="/admin/shopify" element={<AdminGate><AdminShopify /></AdminGate>} />
                  <Route path="/admin/checkout-methods" element={<AdminGate><AdminCheckoutMethods /></AdminGate>} />
                  <Route path="/admin/checkouts" element={<Navigate to="/admin" replace />} />
                  <Route path="/checkouts" element={<CheckoutPrueba1 />} />
                  <Route path="/checkouts/:slug" element={<CheckoutPrueba1 />} />
                  <Route path="/checkout" element={<Navigate to="/checkouts" replace />} />
                  <Route path="/checkout/:slug" element={<Navigate to="/checkouts" replace />} />
                  <Route path="/checkouts/prueba-1" element={<Navigate to="/checkouts" replace />} />
                  <Route path="/checkouts/return" element={<CheckoutReturn />} />
                  <Route path="/checkouts/success" element={<CheckoutSuccess />} />
                  <Route path="/checkouts/failure" element={<CheckoutFailure />} />
                  <Route path="/checkouts/pending" element={<CheckoutPending />} />
                  <Route path="/checkouts/pendiente-manual" element={<CheckoutPendienteManual />} />
                  <Route path="/amazon" element={<AmazonRedirect />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </CartSyncWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  </HelmetProvider>
);

export default App;
