import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import React, { Suspense, useEffect } from "react";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { useCartSync } from "@/hooks/useCartSync";
import { useCartCatalogValidator } from "@/hooks/useCartCatalogValidator";
import { ProductViewTracker } from "@/components/ProductViewTracker";
import { I18nProvider } from "@/i18n/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { getClientId, initClientIdSync } from "@/lib/clientId";
import Index from "./pages/Index";
import { CookieConsent } from "@/components/CookieConsent";
import { EmailSubscribePopup } from "@/components/EmailSubscribePopup";

import { BrevoChatToggle } from "@/components/BrevoChatToggle";
import { AutoTranslate } from "@/components/AutoTranslate";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

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
const DescargaIngles8000 = lazy(() => import("./pages/DescargaIngles8000"));
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
const CopyrightPage = lazy(() => import("./pages/CopyrightPage"));
const TrademarkPage = lazy(() => import("./pages/TrademarkPage"));
const LicensesPage = lazy(() => import("./pages/LicensesPage"));
const ShippingPage = lazy(() => import("./pages/ShippingPage"));
const ReturnsPage = lazy(() => import("./pages/ReturnsPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));

const AdminSEO = lazy(() => import("./pages/AdminSEO"));


const AdminHome = lazy(() => import("./pages/AdminHome"));
const AdminLive = lazy(() => import("./pages/AdminLive"));
const AdminCheckoutMethods = lazy(() => import("./pages/AdminCheckoutMethods"));
const AdminManualPayments = lazy(() => import("./pages/AdminManualPayments"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminProductEdit = lazy(() => import("./pages/AdminProductEdit"));
const AdminEmailTest = lazy(() => import("./pages/AdminEmailTest"));
const AdminHotmartAudit = lazy(() => import("./pages/AdminHotmartAudit"));

const AdminGa4Compare = lazy(() => import("./pages/AdminGa4Compare"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));

const ProductDynamic = lazy(() => import("./pages/ProductDynamic"));
const LearnCategory = lazy(() => import("./pages/LearnCategory"));

import { AdminGate } from "@/components/admin/AdminGate";
const DejarResena = lazy(() => import("./pages/DejarResena"));
const AmazonRedirect = lazy(() => import("./pages/AmazonRedirect"));
const CheckoutTest = lazy(() => import("./pages/CheckoutTest"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutFailure = lazy(() => import("./pages/CheckoutFailure"));
const CheckoutPending = lazy(() => import("./pages/CheckoutPending"));
const CheckoutPendienteManual = lazy(() => import("./pages/CheckoutPendienteManual"));

const queryClient = new QueryClient();

const CartSyncWrapper = ({ children }: { children: React.ReactNode }) => {
  useCartSync();
  useCartCatalogValidator();
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
  useEffect(() => { initClientIdSync(); }, []);
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    try {
      void supabase.functions.invoke("log-funnel-event", {
        body: {
          event_name: "PageView",
          session_id: getSid(),
          client_id: getClientId(),
          page_path: location.pathname,
          country: localStorage.getItem("ilr_country"),
          referrer: getAttributionReferrer(),
        },
      });
    } catch (_) { /* noop */ }
  }, [location.pathname]);
  return null;
};

const PageFallback = () => {
  // Evita el "flash" del spinner en cargas rápidas: sólo se muestra si tarda > 400ms
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);
  if (!show) return <div className="min-h-screen bg-background" aria-hidden />;
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin opacity-70" />
    </div>
  );
};

const CheckoutSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={slug ? `/checkouts/${slug}` : "/checkouts"} replace />;
};

const RouteErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return <AppErrorBoundary resetKey={location.pathname}>{children}</AppErrorBoundary>;
};



const App = () => (
  <HelmetProvider>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteErrorBoundary>
              <CartSyncWrapper>
                <RouteTracker />
                <ProductViewTracker />
                <AutoTranslate />
                <BrevoChatToggle />
                <CookieConsent />
                <EmailSubscribePopup />
                
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/aprender" element={<LearnCategory />} />
                  <Route path="/aprender/:pair" element={<LearnCategory />} />
                  <Route path="/learn" element={<Navigate to="/aprender" replace />} />
                  <Route path="/learn/:pair" element={<LearnCategory />} />
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
                <Route path="/descarga/8000-ingles" element={<DescargaIngles8000 />} />
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
                  <Route path="/copyright" element={<CopyrightPage />} />
                  <Route path="/trademark" element={<TrademarkPage />} />
                  <Route path="/aviso-trademark" element={<TrademarkPage />} />
                  <Route path="/licencias-y-avisos-legales" element={<LicensesPage />} />
                  <Route path="/licenses" element={<LicensesPage />} />
                  <Route path="/envios-y-entregas" element={<ShippingPage />} />
                  <Route path="/shipping-and-delivery" element={<ShippingPage />} />
                  <Route path="/devoluciones-y-reembolsos" element={<ReturnsPage />} />
                  <Route path="/returns-and-refunds" element={<ReturnsPage />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/dejar-resena" element={<DejarResena />} />
                  <Route path="/admin" element={<AdminGate><AdminHome /></AdminGate>} />
                  <Route path="/admin/live" element={<AdminGate><AdminLive /></AdminGate>} />
                  <Route path="/admin/reviews" element={<AdminGate><AdminReviews /></AdminGate>} />
                  
                  <Route path="/admin/seo" element={<AdminGate><AdminSEO /></AdminGate>} />
                  
                  
                  <Route path="/admin/checkout-methods" element={<AdminGate><AdminCheckoutMethods /></AdminGate>} />
                  <Route path="/admin/manual-payments" element={<AdminGate><AdminManualPayments /></AdminGate>} />
                  <Route path="/admin/productos" element={<AdminGate><AdminProducts /></AdminGate>} />
                  <Route path="/admin/productos/:sku" element={<AdminGate><AdminProductEdit /></AdminGate>} />
                  <Route path="/admin/orders" element={<AdminGate><AdminEmailTest /></AdminGate>} />
                  <Route path="/admin/hotmart-audit" element={<AdminGate><AdminHotmartAudit /></AdminGate>} />
                  <Route path="/admin/debug" element={<AdminGate><AdminDebug /></AdminGate>} />
                  <Route path="/admin/ga4-compare" element={<AdminGate><AdminGa4Compare /></AdminGate>} />
                  <Route path="/admin/analytics" element={<AdminGate><AdminAnalytics /></AdminGate>} />
                  
                  <Route path="/admin/checkouts" element={<Navigate to="/admin" replace />} />
                  <Route path="/checkouts" element={<NotFound />} />
                  <Route path="/checkouts/:slug" element={<Checkout />} />
                  <Route path="/checkout" element={<NotFound />} />
                  <Route path="/checkout/:slug" element={<CheckoutSlugRedirect />} />
                  <Route path="/checkouts/prueba-1" element={<NotFound />} />
                  <Route path="/checkouts/return" element={<CheckoutReturn />} />
                  <Route path="/checkouts/success" element={<CheckoutSuccess />} />
                  <Route path="/checkouts/failure" element={<CheckoutFailure />} />
                  <Route path="/checkouts/pending" element={<CheckoutPending />} />
                  <Route path="/checkouts/pendiente-manual" element={<CheckoutPendienteManual />} />
                  <Route path="/amazon" element={<AmazonRedirect />} />
                  {/* Dynamic product page — catches any /products/:slug not matched above (products created in /admin/productos). */}
                  <Route path="/products/:slug" element={<ProductDynamic />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </CartSyncWrapper>
            </RouteErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  </HelmetProvider>
);

export default App;
